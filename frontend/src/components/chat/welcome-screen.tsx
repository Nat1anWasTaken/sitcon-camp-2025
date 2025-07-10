"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  "解釋一個複雜的概念",
  "幫我寫程式碼",
  "創意寫作靈感",
  "問題解決方案",
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <Avatar className="size-16 mx-auto mb-4">
            <AvatarFallback className="text-lg font-medium bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              <svg className="size-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            你好，我是 Siri
          </h1>
          <p className="text-muted-foreground text-lg">
            我是你的智慧助手，有什麼可以幫助你的嗎？
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSuggestionClick(suggestion)}
            >
              <p className="text-sm text-center">{suggestion}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
