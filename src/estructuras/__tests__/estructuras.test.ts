import { Cola } from '../Cola';
import { Pila } from '../Pila';

describe('Pila', () => {
  it('inicia vacía con tamaño 0', () => {
    const pila = new Pila<string>();
    expect(pila.estaVacia()).toBe(true);
    expect(pila.tamanio).toBe(0);
    expect(pila.verTope()).toBeUndefined();
    expect(pila.aArray()).toEqual([]);
  });

  it('respeta el orden LIFO al apilar y desapilar', () => {
    const pila = new Pila<string>();
    pila.push('Libro A');
    pila.push('Libro B');
    pila.push('Libro C');

    expect(pila.tamanio).toBe(3);
    expect(pila.verTope()).toBe('Libro C');
    expect(pila.pop()).toBe('Libro C');
    expect(pila.pop()).toBe('Libro B');
    expect(pila.tamanio).toBe(1);
    expect(pila.aArray()).toEqual(['Libro A']);
  });

  it('devuelve undefined al hacer pop en una pila vacía', () => {
    const pila = new Pila<number>();
    expect(pila.pop()).toBeUndefined();
    expect(pila.tamanio).toBe(0);
  });

  it('aArray devuelve una copia defensiva que no muta la pila interna', () => {
    const pila = new Pila<string>(['Uno', 'Dos']);
    const copia = pila.aArray();
    copia.push('Tres');
    expect(pila.tamanio).toBe(2);
    expect(pila.aArray()).toEqual(['Uno', 'Dos']);
  });

  it('clonar crea una instancia independiente con los mismos elementos', () => {
    const original = new Pila<string>(['A', 'B']);
    const clon = original.clonar();
    clon.push('C');
    expect(original.tamanio).toBe(2);
    expect(clon.tamanio).toBe(3);
  });
});

describe('Cola', () => {
  it('inicia vacía con tamaño 0', () => {
    const cola = new Cola<string>();
    expect(cola.estaVacia()).toBe(true);
    expect(cola.tamanio).toBe(0);
    expect(cola.verFrente()).toBeUndefined();
    expect(cola.aArray()).toEqual([]);
  });

  it('respeta el orden FIFO al encolar y desencolar', () => {
    const cola = new Cola<string>();
    cola.encolar('Ana');
    cola.encolar('Bruno');
    cola.encolar('Carla');

    expect(cola.tamanio).toBe(3);
    expect(cola.verFrente()).toBe('Ana');
    expect(cola.desencolar()).toBe('Ana');
    expect(cola.verFrente()).toBe('Bruno');
    expect(cola.desencolar()).toBe('Bruno');
    expect(cola.tamanio).toBe(1);
    expect(cola.aArray()).toEqual(['Carla']);
  });

  it('devuelve undefined al desencolar una cola vacía', () => {
    const cola = new Cola<string>();
    expect(cola.desencolar()).toBeUndefined();
    expect(cola.tamanio).toBe(0);
    expect(cola.estaVacia()).toBe(true);
  });

  it('calcula correctamente la posición de cada persona en la cola', () => {
    const cola = new Cola<string>(['Lucía', 'Mateo', 'Sofía']);
    expect(cola.posicionDe('Lucía')).toBe(1);
    expect(cola.posicionDe('Sofía')).toBe(3);
    expect(cola.posicionDe('Nadie')).toBe(-1);

    cola.desencolar();
    expect(cola.posicionDe('Mateo')).toBe(1);
    expect(cola.posicionDe('Sofía')).toBe(2);
  });

  it('clonar crea una instancia independiente y resetea índices al vaciarse', () => {
    const original = new Cola<string>(['Ana', 'Luis']);
    const clon = original.clonar();
    clon.desencolar();
    clon.desencolar();
    expect(clon.estaVacia()).toBe(true);
    clon.encolar('Nueva');
    expect(clon.verFrente()).toBe('Nueva');
    expect(original.tamanio).toBe(2);
  });
});
