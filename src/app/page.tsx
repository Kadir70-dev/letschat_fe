import ChatBox from "../../components/ChatBox";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
        <ChatBox />
      </div>
    </main>
  );
}
