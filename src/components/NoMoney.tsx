import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Navigation } from "./navigation";
import { Container } from "./container";

interface Props {
  className?: string;
}
export const NoMoney: React.FC<Props> = ({ className }) => {
  return (
    <div className="bg-gray-200 min-h-screen">
      <Navigation />
      <Container>
        <Card className="mt-4">
          <CardContent className="text-center py-8 space-y-4">
            <p className="text-muted-foreground text-red-500 font-medium text-2xl">
              Доступ к платформе ограничен. Пожалуйста, заплатите.
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};
