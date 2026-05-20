import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-white dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs rounded-3xl border border-gray-200 bg-white px-10 py-12 text-center shadow-xl dark:border-gray-800 dark:bg-gray-900">
              <Link to="/" className="block mb-4">
                <span className="text-3xl font-semibold tracking-wide text-gray-900 dark:text-white">
                  Campus App
                </span>
              </Link>
              <p className="text-sm leading-6 text-gray-500 dark:text-white/70">
                Plataforma académica para gestionar estudiantes, docentes, grupos e inscripciones.
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
