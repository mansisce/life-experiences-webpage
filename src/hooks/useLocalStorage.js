import { useState } from "react";

export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; }
    catch { return initial; }
  });
  function update(v) {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }
  return [val, update];
}
