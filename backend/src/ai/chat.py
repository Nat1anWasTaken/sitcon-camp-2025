"""聊天相關功能"""

from typing import TYPE_CHECKING, AsyncGenerator, List, Optional, Sequence, Union

from google.genai import types

from ..schemas import ChatMessage, ChatStreamChunk, ToolCall
from .client import MODEL_ID, build_message_contents, get_gemini_client

if TYPE_CHECKING:
    from .handlers.unified import UnifiedToolHandler


async def gemini_stream_chat(
    history: List[ChatMessage],
    messages: List[ChatMessage],
    system_prompt: Optional[str] = None,
    config: Optional[types.GenerateContentConfig] = None,
) -> AsyncGenerator[str, None]:
    """基本的 Gemini 聊天串流"""
    contents = build_message_contents(history, messages, system_prompt)

    if not config:
        config = types.GenerateContentConfig(
            temperature=0.7,
            candidate_count=1,
            max_output_tokens=2048,
        )

    try:
        stream = await get_gemini_client().aio.models.generate_content_stream(
            model=MODEL_ID, contents=contents, config=config
        )

        async for chunk in stream:
            if chunk.text:
                yield chunk.text

    except Exception as e:
        print(f"聊天串流錯誤: {e}")
        yield "抱歉，發生錯誤，請稍後再試。"


async def gemini_stream_chat_with_tools(
    history: List[ChatMessage],
    messages: List[ChatMessage],
    tool_handler: "UnifiedToolHandler",
    system_prompt: Optional[str] = None,
    config: Optional[types.GenerateContentConfig] = None,
) -> AsyncGenerator[Union[str, ChatStreamChunk], None]:
    """帶工具功能的 Gemini 聊天"""
    from .handlers.unified import UnifiedToolHandler

    # 強化 system prompt
    force_tool_prompt = "遇到用戶要求新增聯絡人時，請務必呼叫 create_contact 工具，不要僅回覆文字。"
    if system_prompt:
        system_prompt = force_tool_prompt + "\n" + system_prompt
    else:
        system_prompt = force_tool_prompt

    contents = build_message_contents(history, messages, system_prompt)
    tools = UnifiedToolHandler.create_all_tools()

    if not config:
        config = types.GenerateContentConfig(
            temperature=0.7,
            candidate_count=1,
            max_output_tokens=2048,
            tools=tools,
        )

    try:
        response = await get_gemini_client().aio.models.generate_content(
            model=MODEL_ID, contents=contents, config=config
        )
        print("[DEBUG] Gemini response:", response)
        async for chunk in _process_tool_response(response, tool_handler, contents):
            yield chunk

    except Exception as e:
        print(f"工具聊天錯誤: {e}")
        # 降級到普通聊天
        async for chunk in gemini_stream_chat(history, messages, system_prompt):
            yield ChatStreamChunk(type="text", content=chunk, tool_call=None)


async def _process_tool_response(
    response, tool_handler: "UnifiedToolHandler", contents: List[types.Content]
) -> AsyncGenerator[ChatStreamChunk, None]:
    """處理工具回應"""
    if not response.candidates:
        yield ChatStreamChunk(type="text", content="無法產生回應", tool_call=None)
        return

    candidate = response.candidates[0]
    if not candidate.content or not candidate.content.parts:
        yield ChatStreamChunk(type="text", content="無法產生回應", tool_call=None)
        return

    function_responses = []
    has_function_calls = False

    # 處理每個部分
    for part in candidate.content.parts:
        print("[DEBUG] candidate part:", part)
        if hasattr(part, "function_call") and part.function_call:
            has_function_calls = True
            print("[DEBUG] function_call detected:", part.function_call)
            tool_result, tool_info = await tool_handler.handle_tool_call(
                part.function_call
            )
            print("[DEBUG] tool_result:", tool_result)
            print("[DEBUG] tool_info:", tool_info)
            yield ChatStreamChunk(
                type="tool_call",
                content=tool_result,
                tool_call=ToolCall(**tool_info),
            )

            if part.function_call.name:
                function_responses.append(
                    types.Part.from_function_response(
                        name=part.function_call.name, response={"result": tool_result}
                    )
                )
        elif hasattr(part, "text") and part.text:
            yield ChatStreamChunk(type="text", content=part.text, tool_call=None)

    # 如果有工具調用，取得最終回應
    if has_function_calls and function_responses:
        async for chunk in _get_final_response(contents, candidate, function_responses):
            yield chunk


async def _get_final_response(
    contents: List[types.Content], candidate, function_responses: List[types.Part]
) -> AsyncGenerator[ChatStreamChunk, None]:
    """取得工具調用後的最終回應"""
    conversation_parts = list(contents)
    conversation_parts.append(
        types.Content(role="model", parts=list(candidate.content.parts))
    )
    conversation_parts.append(types.Content(role="function", parts=function_responses))

    try:
        final_response = await get_gemini_client().aio.models.generate_content(
            model=MODEL_ID,
            contents=conversation_parts,
            config=types.GenerateContentConfig(
                temperature=0.7,
                candidate_count=1,
                max_output_tokens=2048,
            ),
        )

        if (
            final_response.candidates
            and final_response.candidates[0].content
            and final_response.candidates[0].content.parts
        ):
            for part in final_response.candidates[0].content.parts:
                if hasattr(part, "text") and part.text:
                    yield ChatStreamChunk(
                        type="text", content=part.text, tool_call=None
                    )

    except Exception as e:
        print(f"取得最終回應錯誤: {e}")
        yield ChatStreamChunk(
            type="text", content="處理工具回應時發生錯誤", tool_call=None
        )
