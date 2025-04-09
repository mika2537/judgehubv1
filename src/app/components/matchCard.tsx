
import Image from 'next/image';

export default function MatchCard({ match, router }: { match: any; router: any }) {
  return (
    <div 
      className="relative flex-shrink-0 w-[80vw] h-[80vh] mx-4 rounded-2xl shadow-2xl overflow-hidden group transition-all duration-300 hover:shadow-lg cursor-pointer"
      onClick={() => router.push(`/voting/${match._id}`)}
    >
      <div className="absolute inset-0 bg-gray-300">
        <Image
          src={match.coverImage || "/eventImage/default-event.jpg"}
          alt={match.title}
          fill
          className="object-cover"
          priority
        />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent z-10"></div>
      
      <div className="absolute bottom-0 left-0 z-20 p-8 w-full">
        <h3 className="text-3xl font-bold text-white mb-2">{match.title}</h3>
        <p className="text-gray-200 text-lg mb-4 line-clamp-2">{match.description}</p>
        <div className="flex items-center mb-4">
          <span className="text-gray-300 text-base mr-4">
            {new Date(match.startTime).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </span>
          <span className="text-gray-300 text-base">
            {match.location}
          </span>
        </div>
        {match.totalVotes && (
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-base font-medium">
            {match.totalVotes} votes
          </div>
        )}
      </div>
      
      <div className="absolute bottom-8 right-8 z-20">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg text-lg transition-all shadow-lg transform group-hover:scale-105"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/voting/${match._id}`);
          }}
        >
          Vote Now →
        </button>
      </div>
    </div>
  );
}