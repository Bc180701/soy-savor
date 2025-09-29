
import React from "react";

export const formatCustomProduct = (description?: string, className?: string) => {
  if (!description) return null;

  // Check if it's a sushi creation description
  if (description.includes("Enrobage:") && description.includes("Base:")) {
    const parts = description.split(" | ");
    return (
      <div className={className || "mt-1 text-xs text-gray-600"}>
        {parts.map((part, index) => (
          <div key={index} className="flex">
            <span className="font-medium mr-1">{part.split(":")[0]}:</span>
            <span>{part.split(":")[1]?.trim()}</span>
          </div>
        ))}
      </div>
    );
  }

  // Check if it's a poke creation description (old format)
  if (description.includes("Base:") && description.includes("Protéine:")) {
    const parts = description.split(" | ");
    return (
      <div className={className || "mt-1 text-xs text-gray-600"}>
        {parts.map((part, index) => (
          <div key={index} className="flex">
            <span className="font-medium mr-1">{part.split(":")[0]}:</span>
            <span>{part.split(":")[1]?.trim()}</span>
          </div>
        ))}
      </div>
    );
  }

  // Check if it's a poke creation description (new format with quantities)
  if (description.includes("Ingrédients:") && description.includes("Protéines:")) {
    const parts = description.split(", ");
    return (
      <div className={className || "mt-1 text-xs text-gray-600"}>
        {parts.map((part, index) => (
          <div key={index} className="flex">
            <span className="font-medium mr-1">{part.split(":")[0]}:</span>
            <span>{part.split(":")[1]?.trim()}</span>
          </div>
        ))}
      </div>
    );
  }

  // For other custom products, display as regular text
  if (description.length > 100) {
    return (
      <div className={className || "mt-1 text-xs text-gray-600"}>
        {description}
      </div>
    );
  }

  return null;
};
