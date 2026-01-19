import { computed, Injectable, signal } from '@angular/core';

export type Lang = 'fr' | 'en';

const FR = {
  // Common
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
  'common.edit': 'Éditer',
  'common.add': 'Ajouter',
  'common.all': 'Tous',
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
  'profiles.name': 'Rôle', // Was Nom, renamed for clarity
  'profiles.username': 'Nom du collaborateur',
  'profiles.rate': 'TJM',
  'profiles.active': 'Actif',
  'profiles.create_title': 'Nouveau Profil',
  'profiles.edit_title': 'Éditer le profil',
  'profiles.edit_desc': 'Modifiez votre profil ici. Cliquez sur enregistrer une fois terminé.',
  'profiles.save_changes': 'Enregistrer les modifications',
  'profiles.name_exists': 'Ce nom existe déjà',
  'profiles.rate_positive': 'Doit être > 0',

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
  'backlog.edit_title': "Modifier l'item",
  'backlog.create_desc': 'Ajoutez une nouvelle fonctionnalité au backlog.',
  'backlog.filter_profiles': 'Filtrer par profil',
  'backlog.filter_columns': 'Colonnes visibles',
};

const EN = {
  // Common
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.all': 'All',
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
  'profiles.name': 'Role', // Was Name
  'profiles.username': 'Collaborator Name',
  'profiles.rate': 'Daily Rate',
  'profiles.active': 'Active',
  'profiles.create_title': 'New Profile',
  'profiles.edit_title': 'Edit profile',
  'profiles.edit_desc': "Make changes to your profile here. Click save when you're done.",
  'profiles.save_changes': 'Save changes',
  'profiles.name_exists': 'Name already exists',
  'profiles.rate_positive': 'Must be > 0',

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
  'backlog.edit_title': 'Edit Item',
  'backlog.create_desc': 'Add a new feature to the backlog.',
  'backlog.filter_profiles': 'Filter by profile',
  'backlog.filter_columns': 'Visible columns',
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
