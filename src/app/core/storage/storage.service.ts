import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  /**
   * Permet de setter un object de type T dans le local storage
   *
   * @param key
   * @param obj
   */
  public setInLocalStorage<T>(key: string, obj: T): void {
    if(localStorage.getItem(key)) {
        localStorage.removeItem(key);
    }

    localStorage.setItem(key, JSON.stringify(obj));
  }

  /**
   * Permet de récupérer un objet via sa clé du local storage
   *
   * @param key
   * @returns l'object du local storage
   */
  public getInLocalStorage<T>(key: string): T | null {
    if(localStorage.getItem(key)) {
        return JSON.parse(localStorage.getItem(key));
    }

    return null;
  }

  /**
   * Permet de vider le session storage
   * de l'utilisateur en cours
   */
  public clearSessionStorage(): void {
    for (const item in {...localStorage}) {
      if(item !== 'theme') {
          localStorage.removeItem(item);
      }
    }
  }
}
