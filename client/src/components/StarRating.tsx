import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, onRate, disabled = false, size = "md" }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div className="flex items-center gap-1" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          data-testid={`star-${star}`}
          className={`transition-all duration-150 ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onRate(star)}
        >
          <Star
            className={`${sizeClasses[size]} transition-colors ${
              star <= (hover || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
