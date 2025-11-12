export default function FooterMobile({ user, handleLogout }) {
  return (
    <div className="lg:hidden w-full h-[64px] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 flex items-center justify-between sticky bottom-0"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex flex-col">
        <span className="text-sm font-medium">Olá, {user?.name || "Usuário"}</span>
        {(user?.is_admin || user?.role === "admin") && (
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1 self-start">
            Admin
          </span>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-all active:scale-95"
      >
        Logout
      </button>
    </div>
  );
}

