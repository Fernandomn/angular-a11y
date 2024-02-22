import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  EMPTY,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { LivroComponent } from '../../componentes/livro/livro.component';
import { Item, LivrosResultado } from '../../models/interfaces';
import { LivroVolumeInfo } from '../../models/livroVolumeInfo';
import { LivroService } from '../../service/livro.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

const PAUSA = 300;

@Component({
  selector: 'app-lista-livros',
  standalone: true,
  imports: [
    HttpClientModule,
    CommonModule,
    LivroComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './lista-livros.component.html',
  styleUrl: './lista-livros.component.css',
})
export class ListaLivrosComponent implements AfterViewInit {
  @ViewChild('searchFieldElement') searchFieldElement!: ElementRef;

  campoBusca = new FormControl();
  mensagemErro = '';
  livrosResultado!: LivrosResultado;

  constructor(
    private service: LivroService,
    private liveAnnouncer: LiveAnnouncer
  ) {}

  ngAfterViewInit(): void {
    this.searchFieldElement.nativeElement.focus();
  }

  livrosEncontrados$ = this.campoBusca.valueChanges.pipe(
    debounceTime(PAUSA),
    filter((valorDigitado) => valorDigitado.length >= 3),
    distinctUntilChanged(),
    switchMap((valorDigitado) => {
      if (valorDigitado.trim() === '') {
        return EMPTY;
      } else {
        return this.service.buscar(valorDigitado);
      }
    }),
    tap((resultado) => {
      this.livrosResultado = resultado;
      this.liveAnnouncer.announce(
        `${this.livrosResultado.totalItems} resultados encontrados`
      );
    }),
    map((resultado) => resultado.items ?? []),
    map((items) => this.livrosResultadoParaLivros(items)),
    catchError(() => {
      this.mensagemErro = 'Ops, ocorreu um erro. Recarregue a aplicação!';
      return throwError(() => new Error(this.mensagemErro));
    })
  );

  livrosResultadoParaLivros(items: Item[]): LivroVolumeInfo[] {
    return items.map((item) => {
      return new LivroVolumeInfo(item);
    });
  }
}
