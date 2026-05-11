import React from "react";

import {
    BrowserRouter as Router,
    Routes,
    Route
} from "react-router-dom";

// =====================================================
// 🔹 LAYOUT
// =====================================================

import AppLayout
from "./layout/AppLayout";

import {
    ScrollToTop
} from "./components/common/ScrollToTop";

// =====================================================
// 🔹 PÁGINAS ORIGINALES
// =====================================================

import SignIn
from "./pages/AuthPages/SignIn";

import SignUp
from "./pages/AuthPages/SignUp";

import NotFound
from "./pages/OtherPage/NotFound";

import UserProfiles
from "./pages/UserProfiles";

import Videos
from "./pages/UiElements/Videos";

import Images
from "./pages/UiElements/Images";

import Alerts
from "./pages/UiElements/Alerts";

import Badges
from "./pages/UiElements/Badges";

import Avatars
from "./pages/UiElements/Avatars";

import Buttons
from "./pages/UiElements/Buttons";

import LineChart
from "./pages/Charts/LineChart";

import BarChart
from "./pages/Charts/BarChart";

import Calendar
from "./pages/Calendar";

import BasicTables
from "./pages/Tables/BasicTables";

import FormElements
from "./pages/Forms/FormElements";

import Blank
from "./pages/Blank";

import Home
from "./pages/Dashboard/Home";

// =====================================================
// 🔹 RUTAS CUSTOM
// =====================================================

import routes
from "./routes";

// =====================================================
// 🔹 APP
// =====================================================

const App: React.FC = () => {

    return (

        <Router>

            <ScrollToTop />

            <Routes>

                {/* ===================================== */}
                {/* 🔹 DASHBOARD LAYOUT */}
                {/* ===================================== */}

                <Route element={<AppLayout />}>

                    {/* HOME */}
                    <Route
                        index
                        path="/"
                        element={<Home />}
                    />

                    {/* OTRAS */}
                    <Route
                        path="/profile"
                        element={<UserProfiles />}
                    />

                    <Route
                        path="/calendar"
                        element={<Calendar />}
                    />

                    <Route
                        path="/blank"
                        element={<Blank />}
                    />

                    {/* FORMS */}
                    <Route
                        path="/form-elements"
                        element={<FormElements />}
                    />

                    {/* TABLES */}
                    <Route
                        path="/basic-tables"
                        element={<BasicTables />}
                    />

                    {/* UI */}
                    <Route
                        path="/alerts"
                        element={<Alerts />}
                    />

                    <Route
                        path="/avatars"
                        element={<Avatars />}
                    />

                    <Route
                        path="/badge"
                        element={<Badges />}
                    />

                    <Route
                        path="/buttons"
                        element={<Buttons />}
                    />

                    <Route
                        path="/images"
                        element={<Images />}
                    />

                    <Route
                        path="/videos"
                        element={<Videos />}
                    />

                    {/* CHARTS */}
                    <Route
                        path="/line-chart"
                        element={<LineChart />}
                    />

                    <Route
                        path="/bar-chart"
                        element={<BarChart />}
                    />

                    {/* ===================================== */}
                    {/* 🔹 RUTAS DINÁMICAS */}
                    {/* ===================================== */}

                    {
                        routes.map((route) => (

                            <Route
                                key={route.path}
                                path={route.path}
                                element={
                                    <route.component />
                                }
                            />

                        ))
                    }

                </Route>

                {/* ===================================== */}
                {/* 🔹 AUTH */}
                {/* ===================================== */}

                <Route
                    path="/signin"
                    element={<SignIn />}
                />

                <Route
                    path="/signup"
                    element={<SignUp />}
                />

                {/* ===================================== */}
                {/* 🔹 404 */}
                {/* ===================================== */}

                <Route
                    path="*"
                    element={<NotFound />}
                />

            </Routes>

        </Router>

    );

};

export default App;