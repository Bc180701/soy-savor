
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatisticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

const StatisticsCard = ({
  title,
  value,
  description,
  icon,
  className,
}: StatisticsCardProps) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-5 w-5 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
