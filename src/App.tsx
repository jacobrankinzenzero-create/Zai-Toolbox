import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Autodoc from './Autodoc';
import Autoflow from './Autoflow';
import ShiftModeler from './ShiftModeler';

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
