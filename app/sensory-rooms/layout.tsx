export default function SensoryRoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-black">
      {children}
    </div>
  );
}
