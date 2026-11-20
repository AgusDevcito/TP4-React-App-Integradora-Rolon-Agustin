export class Cola<T> {
  #items: Record<number, T> = {};
  #frente = 0;
  #final = 0;

  constructor(iniciales?: readonly T[]) {
    if (iniciales) {
      for (const elemento of iniciales) {
        this.encolar(elemento);
      }
    }
  }

  encolar(elemento: T): void {
    this.#items[this.#final] = elemento;
    this.#final += 1;
  }

  desencolar(): T | undefined {
    if (this.estaVacia()) {
      return undefined;
    }
    const elemento = this.#items[this.#frente];
    delete this.#items[this.#frente];
    this.#frente += 1;
    if (this.#frente === this.#final) {
      this.#frente = 0;
      this.#final = 0;
    }
    return elemento;
  }

  verFrente(): T | undefined {
    if (this.estaVacia()) {
      return undefined;
    }
    return this.#items[this.#frente];
  }

  estaVacia(): boolean {
    return this.#final - this.#frente === 0;
  }

  get tamanio(): number {
    return this.#final - this.#frente;
  }

  aArray(): T[] {
    const resultado: T[] = [];
    for (let i = this.#frente; i < this.#final; i += 1) {
      resultado.push(this.#items[i]);
    }
    return resultado;
  }

  posicionDe(elemento: T): number {
    let posicion = 1;
    for (let i = this.#frente; i < this.#final; i += 1) {
      if (this.#items[i] === elemento) {
        return posicion;
      }
      posicion += 1;
    }
    return -1;
  }

  clonar(): Cola<T> {
    return new Cola<T>(this.aArray());
  }
}
