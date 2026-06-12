import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import your pages and apps
import Home from './pages/Home';
import Autodoc from './apps/Autodoc';
import Autoflow from './apps/Autoflow';
import ShiftModeler from './apps/ShiftModeler';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/autodoc" element={<Autodoc />} />
        <Route path="/autoflow" element={<Autoflow />} />
        <Route path="/shift-modeler" element={<ShiftModeler />} />
      </Routes>
    </BrowserRouter>
  );
}