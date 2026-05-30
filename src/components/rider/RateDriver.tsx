"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { Star } from "lucide-react";

interface RateDriverProps {
  rideId: string;
  driverName: string;
  existingRating?: number | null;
  onRated?: () => void;
}

export function RateDriver({
  rideId,
  driverName,
  existingRating,
  onRated,
}: RateDriverProps) {
  const [rating, setRating] = useState(existingRating || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(!!existingRating);

  async function submitRating() {
    if (rating < 1) {
      setError("Please select a star rating");
      return;
    }
    setLoading(true);
    setError("");
    const { error: err } = await api(`/api/rides/${rideId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "rate", rating, comment }),
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setSubmitted(true);
    onRated?.();
  }

  if (submitted) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-5 text-center">
          <div className="mb-2 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-6 w-6 ${s <= (existingRating || rating) ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
              />
            ))}
          </div>
          <p className="font-medium">Thanks for rating {driverName}!</p>
          <p className="text-sm text-slate-400">Your feedback helps improve Movee.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-lg font-semibold">Rate your driver</h2>
          <p className="text-sm text-slate-400">How was your trip with {driverName}?</p>
        </div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="rounded-lg p-1 transition hover:scale-110"
            >
              <Star
                className={`h-9 w-9 ${
                  s <= (hover || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-600"
                }`}
              />
            </button>
          ))}
        </div>
        <Input
          label="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Great ride, smooth driving..."
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button className="w-full" onClick={submitRating} loading={loading}>
          Submit rating
        </Button>
      </CardContent>
    </Card>
  );
}
