import Image from "next/image";

interface MatchHeaderProps {
  title: string;
  date: string;
  location: string;
  totalVotes: number;
  description: string;
}
  
  export default function MatchHeader({
    title,
    date,
    location,
    totalVotes,
    description,
  }: MatchHeaderProps) {
    return (
      <div className="relative h-72 bg-gray-800 overflow-hidden mb-8">
        <Image
          src="/Teams-Background-3.webp"
          alt={title}
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
        <div className="relative z-10 p-8 h-full flex flex-col justify-end">
          <div className="max-w-4xl">
            <div className="inline-flex flex-wrap gap-2 mb-3">
              <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm border border-white/20">
                {date}
              </span>
              <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm border border-white/20">
                {location}
              </span>
              <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm border border-white/20">
                {totalVotes} votes
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {title}
            </h1>
            <p className="text-white/90 max-w-3xl">{description}</p>
          </div>
        </div>
      </div>
    );
  }