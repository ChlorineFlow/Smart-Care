import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/70 shadow-sm px-8 py-4 flex justify-between items-center">

      {/* Logo */}
      <h1
        onClick={() => navigate("/")}
        className="text-2xl font-bold text-blue-600 tracking-wide cursor-pointer"
      >
        ❤️ SmartCare
      </h1>

      {/* Links */}
      <div className="hidden md:flex space-x-8 text-gray-700 font-medium">
        <a href="#home" className="hover:text-blue-600 transition">Home</a>
        <a href="#features" className="hover:text-blue-600 transition">Features</a>
        <a href="#doctors" className="hover:text-blue-600 transition">Doctors</a>
        <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
      </div>

      {/* Buttons */}
      <div className="space-x-4">

        {/* Sign In */}
        <button
          onClick={() => navigate("/select-role-login")}
          className="text-gray-700 hover:text-blue-600 transition"
        >
          Sign In
        </button>

        {/* Sign Up */}
        <button
          onClick={() => navigate("/select-role")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-md transition"
        >
          Sign Up
        </button>

      </div>

    </nav>
  );
}