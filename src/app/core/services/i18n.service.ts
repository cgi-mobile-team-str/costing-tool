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
  'common.total': 'Total',
  'common.selected': 'sélectionné(s)',
  'common.delete_selected': 'Supprimer la sélection',
  'common.confirm_bulk_delete': 'Supprimer ces éléments ?',
  'common.duplicate': 'Dupliquer',
  'common.yes': 'Oui',
  'common.no': 'Non',

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
  'dash.global': 'Global',
  'dash.ht_label': 'HT',
  'dash.cost_distribution': 'Répartition des coûts',

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
  'profiles.global_margin': 'Marge Global (%)',
  'profiles.search_placeholder': 'Rechercher un profil...',
  'profiles.no_results': 'Aucun profil trouvé pour',

  // Settings
  'settings.project_section': 'Projet',
  'settings.project_name': 'Nom du projet',
  'settings.calculations_section': 'Calculs',
  'settings.currency': 'Devise',
  'settings.interface_section': 'Interface',
  'settings.language': 'Langue',
  'settings.data_section': 'Gestion des données',
  'settings.data_hint':
    "Exportez votre backlog actuel ou importez un nouveau projet à partir d'un fichier JSON.",
  'settings.import_json': 'Importer un Backlog (JSON)',
  'settings.export_json': 'Exporter le Backlog (JSON)',
  'settings.danger_zone': 'Zone de danger',
  'settings.reset_app': 'Réinitialiser les données',
  'settings.example': 'Ex:',

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
  'backlog.delete_title': "Supprimer l'élément",
  'backlog.delete_confirm': 'Êtes-vous sûr de vouloir supprimer cet élément ?',
  'backlog.no_items': 'Aucun élément trouvé.',
  'backlog.cost_ht': '(HT)',
  'backlog.rtu': 'RTU',
  'backlog.ratio': 'Ratio',
  'backlog.scope_mvp': 'MVP',
  'backlog.scope_v1': 'V1',
  'backlog.scope_v2': 'V2',
  'backlog.moscow_must': 'Must',
  'backlog.moscow_should': 'Should',
  'backlog.moscow_could': 'Could',
  'backlog.moscow_wont': 'Wont',
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
  'common.total': 'Total',
  'common.selected': 'selected',
  'common.delete_selected': 'Delete Selected',
  'common.confirm_bulk_delete': 'Delete these items?',
  'common.duplicate': 'Duplicate',
  'common.yes': 'Yes',
  'common.no': 'No',

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
  'dash.global': 'Global',
  'dash.ht_label': 'Excl. Tax',
  'dash.cost_distribution': 'Cost Distribution',

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
  'profiles.global_margin': 'Global Margin (%)',
  'profiles.search_placeholder': 'Search profile...',
  'profiles.no_results': 'No profile found for',

  // Settings
  'settings.project_section': 'Project',
  'settings.project_name': 'Project Name',
  'settings.calculations_section': 'Calculations',
  'settings.currency': 'Currency',
  'settings.interface_section': 'Interface',
  'settings.language': 'Language',
  'settings.data_section': 'Data Management',
  'settings.data_hint': 'Export your current backlog or import a new project from a JSON file.',
  'settings.import_json': 'Import Backlog (JSON)',
  'settings.export_json': 'Export Backlog (JSON)',
  'settings.danger_zone': 'Danger Zone',
  'settings.reset_app': 'Reset App Data',
  'settings.example': 'Ex:',

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
  'backlog.delete_title': 'Delete Item',
  'backlog.delete_confirm': 'Are you sure you want to delete this item?',
  'backlog.no_items': 'No items found.',
  'backlog.cost_ht': '(Excl. Tax)',
  'backlog.rtu': 'RTU',
  'backlog.ratio': 'Ratio',
  'backlog.scope_mvp': 'MVP',
  'backlog.scope_v1': 'V1',
  'backlog.scope_v2': 'V2',
  'backlog.moscow_must': 'Must',
  'backlog.moscow_should': 'Should',
  'backlog.moscow_could': 'Could',
  'backlog.moscow_wont': 'Wont',
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
