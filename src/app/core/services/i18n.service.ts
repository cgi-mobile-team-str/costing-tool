import { computed, Injectable, signal } from '@angular/core';

export type Lang = 'fr' | 'en';

const FR = {
  // Common
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
  'common.edit': 'Éditer',
  'common.add': 'Ajouter',
  'common.actions': 'Actions',
  'common.required': 'Requis',
  'common.confirm_delete': 'Êtes-vous sûr de vouloir supprimer cet élément ?',

  // Navigation
  'nav.backlog': 'Backlog',
  'nav.profiles': 'Profils & Taux',
  'nav.settings': 'Paramètres',
  'nav.dashboard': 'Tableau de bord',

  // Dashboard
  'dash.total_ht': 'Total HT',
  'dash.margin': 'Marge',
  'dash.total_ttc': 'Total (avec marge)',
  'dash.top_expensive': 'Top 5 Coûts',

  // Profiles
  'profiles.name': 'Nom',
  'profiles.rate': 'TJM',
  'profiles.active': 'Actif',
  'profiles.create_title': 'Nouveau Profil',

  // Backlog
  'backlog.title': 'Feature', // Renamed from Titre
  'backlog.product': 'Produit',
  'backlog.cluster': 'Cluster',
  'backlog.scope': 'Périmètre',
  'backlog.moscow': 'MoSCoW',
  'backlog.effort': 'Charge',
  'backlog.profile': 'Profil',
  'backlog.cost': 'Coût',
  'backlog.create_title': 'Nouvel Item',
  'backlog.hypotheses': 'Hypothèses',
  'backlog.comments': 'Commentaires',
  'backlog.chargeType': 'Type',
  'backlog.description': 'Description',
};

const EN = {
  // Common
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.actions': 'Actions',
  'common.required': 'Required',
  'common.confirm_delete': 'Are you sure you want to delete this item?',

  // Navigation
  'nav.backlog': 'Backlog',
  'nav.profiles': 'Profiles & Rates',
  'nav.settings': 'Settings',
  'nav.dashboard': 'Dashboard',

  // Dashboard
  'dash.total_ht': 'Total Excl. Tax',
  'dash.margin': 'Margin',
  'dash.total_ttc': 'Total (w/ Margin)',
  'dash.top_expensive': 'Top 5 Expensive',

  // Profiles
  'profiles.name': 'Name',
  'profiles.rate': 'Daily Rate',
  'profiles.active': 'Active',
  'profiles.create_title': 'New Profile',

  // Backlog
  'backlog.title': 'Feature',
  'backlog.product': 'Product',
  'backlog.cluster': 'Cluster',
  'backlog.scope': 'Scope',
  'backlog.moscow': 'MoSCoW',
  'backlog.effort': 'Effort',
  'backlog.profile': 'Profile',
  'backlog.cost': 'Cost',
  'backlog.create_title': 'New Item',
  'backlog.hypotheses': 'Hypotheses',
  'backlog.comments': 'Comments',
  'backlog.chargeType': 'Type',
  'backlog.description': 'Description',
};

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private currentLang = signal<Lang>('fr');

  readonly translations = computed(() => {
    return this.currentLang() === 'fr' ? FR : EN;
  });

  setLang(lang: Lang) {
    this.currentLang.set(lang);
  }

  getLang() {
    return this.currentLang();
  }

  translate(key: string): string {
    const t = this.translations() as any;
    return t[key] || key;
  }
}
