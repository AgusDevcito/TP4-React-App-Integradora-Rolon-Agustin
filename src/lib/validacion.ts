import { LIBROS } from '../data/libros';
import type { Libro } from '../types';

const PATRON_ISBN_13 = /^\d{13}$/;

export function limpiarIsbn(entrada: string): string {
  return entrada.replace(/[\s-]/g, '').trim();
}

export function esIsbnValido(isbn: string): boolean {
  return PATRON_ISBN_13.test(isbn);
}

export function buscarLibroPorIsbn(isbn: string): Libro | undefined {
  return LIBROS.find((libro) => libro.isbn === isbn);
}

export function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha.getTime());
  copia.setDate(copia.getDate() + dias);
  return copia;
}

export function formatearFechaCorta(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) {
    return fechaIso;
  }
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}
