import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
export default function Landing() {
     const navigate = useNavigate();
  return (
    
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      {/* HERO */}
      <section
        id="home"
        className="pt-28 px-10 py-20 flex flex-col md:flex-row items-center justify-between"
      >
        {/* Left */}
        <div className="max-w-xl">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            Smart Appointment <br />
            Scheduling for{" "}
            <span className="text-blue-600">Better Healthcare</span>
          </h1>

          <p className="text-gray-600 mt-6 leading-relaxed">
            Book appointments with top healthcare professionals effortlessly.
            Manage your schedule, avoid long waiting times, and receive instant
            updates — all in one smart platform designed for better healthcare
            experiences.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex space-x-4">
            <button
  onClick={() => navigate("/select-role")}
  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition transform hover:scale-105"
>
  Book Appointment
</button>

            <button
              onClick={() => {
                document.getElementById("features").scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-100 transition"
            >
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="flex space-x-10 mt-10">
            <div>
              <h2 className="text-2xl font-bold">500+</h2>
              <p className="text-gray-500">Doctors</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold">50K+</h2>
              <p className="text-gray-500">Patients</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold">4.9</h2>
              <p className="text-gray-500">Rating</p>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="mt-10 md:mt-0">
          <img
            src="https://images.unsplash.com/photo-1584515933487-779824d29309"
            className="w-[520px] rounded-2xl shadow-2xl transform hover:scale-105 transition duration-500"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-10 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose SmartCare?
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          {["Easy Booking", "Doctor Ratings", "Real-time Updates"].map(
            (item, i) => (
              <div
                key={i}
                className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-2"
              >
                <h3 className="text-xl font-semibold">{item}</h3>
                <p className="text-gray-600 mt-3">
                  Experience seamless and efficient healthcare services with
                  SmartCare.
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* DOCTORS */}
      <section id="doctors" className="px-10 py-20 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12">
          Meet Our Doctors
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          {[1, 2, 3].map((doc) => (
            <div
              key={doc}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition text-center"
            >
              <img
                src={`https://randomuser.me/api/portraits/men/${30 + doc}.jpg`}
                className="w-24 h-24 rounded-full mx-auto"
              />
              <h3 className="mt-4 font-semibold text-lg">Dr. John Doe</h3>
              <p className="text-gray-500">Cardiologist</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-10 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Contact Us</h2>

        <p className="text-gray-600">📧 smartcare@gmail.com</p>
        <p className="text-gray-600">📞 +91 9876543210</p>
      </section>
    </div>
  );
}
