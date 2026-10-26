/**  This file is part of FreeTumble.
  *
  *  FreeTumble is free software: you can redistribute it and/or modify
  *  it under the terms of the GNU General Public License as published by
  *  the Free Software Foundation, either version 3 of the License, or
  *  (at your option) any later version.
  *
  *  FreeTumble is distributed in the hope that it will be useful,
  *  but WITHOUT ANY WARRANTY; without even the implied warranty of
  *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  *  GNU General Public License for more details.
  *
  *  You should have received a copy of the GNU General Public License
  *  along with FreeTumble.  If not, see <http://www.gnu.org/licenses/>.
  */

#ifndef LANGUAGES_H_INCLUDED
#define LANGUAGES_H_INCLUDED


const int N_LANGUAGES=4;
const int CONSOLE_MAX_LINES=11;
const int CONSOLE_HELP=7;
const int CONSOLE_OPTIONS=8;
const int CONSOLE_CREDITS=9;
const int CONSOLE_QUIT=10;

const int LANG_EN=0;
const int LANG_FR=1;
const int LANG_DE=2;
const int LANG_PT_BR=3;

const std::wstring MENU_YES[N_LANGUAGES]=
    { L"Yes", L"Oui", L"Ja", L"Sim" };

const std::wstring MENU_NO[N_LANGUAGES]=
    { L"No", L"Non", L"Nein", L"Não" };

const std::wstring MENU_BACK[N_LANGUAGES]=
    { L"Back", L"Retour", L"Zurück", L"Voltar" };

const std::wstring MENU_OPTIONS_TITLE[N_LANGUAGES]=
    { L"Options", L"Options", L"Optionen", L"Opções" };

const std::wstring MENU_OPTIONS_SOUND_CONFIG[N_LANGUAGES]=
    { L"Sound", L"Son", L"Klang", L"Som" };

const std::wstring MENU_OPTIONS_SOUND[N_LANGUAGES]=
    { L"Sound effects", L"Effets sonores", L"Soundeffekte", L"Efeitos sonoros" };

const std::wstring MENU_OPTIONS_MUSIC[N_LANGUAGES]=
    { L"Music", L"Musique", L"Musik", L"Música" };

const std::wstring MENU_OPTIONS_EFFECTS[N_LANGUAGES]=
    { L"Visual effects", L"Effets visuels", L"Spezialeffekte", L"Efeitos visuais" };

const std::wstring MENU_OPTIONS_LANGUAGE[N_LANGUAGES]=
    { L"Language", L"Langue", L"Sprache", L"Idioma" };

const std::wstring MENU_OPTIONS_SKIN[N_LANGUAGES]=
    { L"Skin", L"Thème", L"Thema", L"Tema" };

const std::wstring MENU_OPTIONS_RESET_SCORES[N_LANGUAGES]=
    { L"Reset the scores", L"Remise à zéro des scores", L"Punktestand zurücksetzen", L"Redefinir pontuações" };

const std::wstring LANGUAGES[N_LANGUAGES][N_LANGUAGES]={
    {L"English", L"French", L"German", L"Portuguese (Brazil)"},
    {L"Anglais", L"Français", L"Allemand", L"Portugais (Brésil)"},
    {L"Englisch", L"Französisch", L"Deutsch", L"Portugiesisch (Brasilien)"},
    {L"Inglês", L"Francês", L"Alemão", L"Português (Brasil)"} };

const std::wstring MENU_MAIN_TITLE[N_LANGUAGES]=
    { L"Menu", L"Menu", L"Menü", L"Menu" };

const std::wstring MENU_HELP[N_LANGUAGES]=
    { L"Help", L"Aide", L"Hilfe", L"Ajuda" };

const std::wstring MENU_CREDITS[N_LANGUAGES]=
    { L"Credits", L"Credits", L"Credits", L"Créditos" };

const std::wstring MENU_QUIT_QUIT[N_LANGUAGES]=
    { L"Quit the game", L"Abandonner la partie", L"Spiel verlassen", L"Sair do jogo" };

const std::wstring MENU_RESET_TITLE[N_LANGUAGES]=
    { L"Confirmation", L"Confirmation", L"Bestätigung", L"Confirmação" };

const std::wstring MENU_RESET_RESET[N_LANGUAGES]=
    { L"Reset scores", L"Réinitialiser les scores", L"Punktestand zurücksetzen", L"Redefinir pontuações" };

const std::wstring MENU_OPTIONS_SOUND_VOLUME[N_LANGUAGES]=
    { L"FX Sound volume", L"Volume des effets", L"Klanglautstärke", L"Volume dos efeitos" };

const std::wstring MENU_OPTIONS_MUSIC_VOLUME[N_LANGUAGES]=
    { L"Music volume", L"Volume de la musique", L"Musiklautstärke", L"Volume da música" };


const std::wstring STRING_HI_SCORES[N_LANGUAGES]=
    { L"Hall of fame", L"Meilleurs scores", L"Beste Spieler", L"Recordes" };

const std::wstring STRING_PLAY_AGAIN[N_LANGUAGES]=
    { L"Play again", L"Rejouer", L"Neues Spiel", L"Jogar novamente" };

const std::wstring STRING_BACK_TO_MENU[N_LANGUAGES]=
    { L"Back to menu", L"Menu principal", L"Hauptmenü", L"Voltar ao menu" };

const std::wstring ENTER_NAME[N_LANGUAGES]=
    { L"Enter your name", L"Saisissez votre nom", L"Geben Sie Ihren Namen ein", L"Digite seu nome" };

const std::wstring CLICK_TO_CONTINUE[N_LANGUAGES]=
    { L"Click to continue", L"Cliquez pour retourner au jeu", L"Klicken Sie, um weiter zu spielen", L"Clique para continuar" };

const std::wstring CREDITS_TITLE[N_LANGUAGES]=
    { L"Credits", L"Crédits", L"Credits", L"Créditos" };

const std::wstring CREDITS_PROGRAMMER[N_LANGUAGES]=
    { L"Development", L"Développement", L"Entwicklung", L"Desenvolvimento" };

const std::wstring CREDITS_GRAPHICS[N_LANGUAGES]=
    { L"Graphics", L"Graphismes", L"Graphikdesign", L"Gráficos" };

const std::wstring CREDITS_SOUND[N_LANGUAGES]=
    { L"Sound effects", L"Effets sonores", L"Toneffekte", L"Efeitos sonoros" };

const std::wstring CREDITS_MUSIC[N_LANGUAGES]=
    { L"Music", L"Musique", L"Musik", L"Música" };

const std::wstring HELP_TITLE[N_LANGUAGES]=
    { L"Instructions", L"Instructions", L"Spielanleitung", L"Instruções" };

const std::wstring HELP_NORMAL1[N_LANGUAGES]=
    { L"Click zones with 3 or more stones of the same color to make them disappear.",
      L"Cliquez sur des zones composées d'au moins 3 pièces de même couleur pour les faire disparaître.",
      L"Klicken Sie auf Zonen mit 3 oder mehr Steinen der gleichen Farbe, um sie zu entfernen.", L"Clique em grupos de 3 ou mais pedras da mesma cor para fazê-las desaparecer." };

const std::wstring HELP_NORMAL2[N_LANGUAGES]=
    { L"Don't let the stones rise to the top ! (Turn based)",
      L"Ne laissez pas les pièces atteindre le sommet ! (les lignes montent à chaque tour)",
      L"Lassen Sie die Steine nicht den oberen Rand erreichen! (Die Zeilen steigen bei jeder Runde.)", L"Não deixe as pedras chegarem ao topo! (Por turnos)" };

const std::wstring HELP_MOTION1[N_LANGUAGES]=
    { L"Click zones with 3 or more stones of the same color to make them disappear.",
      L"Cliquez sur des zones composées d'au moins 3 pièces de même couleur pour les faire disparaître.",
      L"Klicken Sie auf Zonen mit 3 oder mehr Steinen der gleichen Farbe, um sie zu entfernen.", L"Clique em grupos de 3 ou mais pedras da mesma cor para fazê-las desaparecer." };

const std::wstring HELP_MOTION2[N_LANGUAGES]=
    { L"Don't let the stones rise to the top ! (Real time)",
      L"Ne laissez pas les pièces atteindre le sommet ! (les lignes montent en temps réel)",
      L"Lassen Sie die Steine nicht den oberen Rand erreichen! (Die Zeilen steigen in Echtzeit.)", L"Não deixe as pedras chegarem ao topo! (Tempo real)" };

const std::wstring HELP_CLASSIC1[N_LANGUAGES]=
    { L"Click zones with 2 or more stones of the same color to make them disappear.",
      L"Cliquez sur des zones composées d'au moins 2 pièces de même couleur pour les faire disparaître.",
      L"Klicken Sie auf Zonen mit 2 oder mehr Steinen der gleichen Farbe, um sie zu entfernen.", L"Clique em grupos de 2 ou mais pedras da mesma cor para fazê-las desaparecer." };

const std::wstring HELP_CLASSIC2[N_LANGUAGES]=
    { L"Try to clear the entire grid !",
      L"Essayez de vider complètement la grille !",
      L"Versuchen Sie, sämtliche Steine wegzuräumen !", L"Tente limpar todo o tabuleiro!" };

const std::wstring HELP_BONUS_COLOR[N_LANGUAGES]=
    { L"Remove all the stones of a same color.",
      L"Supprime toutes les pièces d'une même couleur.",
      L"Zerstört alle Steine der gleichen Farbe", L"Remove todas as pedras de uma mesma cor." };

const std::wstring HELP_BONUS_BOMB[N_LANGUAGES]=
    { L"Remove all the stones within an area around the bomb.",
      L"Supprime les pièces dans la zone de l'explosion.",
      L"Zerstört die Steine im Umfeld der Bombe.", L"Remove todas as pedras na área ao redor do bônus." };

const std::wstring HELP_BONUS_ARROW[N_LANGUAGES]=
    { L"Remove the stones in the same horizontal and vertical axe.",
      L"Supprime les pièces se trouvant sur les mêmes axes horizontaux et verticaux.",
      L"Zerstört die Steine in der selben horizontalen und vertikalen Achse.", L"Remove as pedras nos mesmos eixos horizontal e vertical." };

const std::wstring HELP_BONUS_SKULL[N_LANGUAGES]=
    { L"Can only be removed with bomb oder lightning.",
      L"Peut seulement être supprimé à l'aide des bombes ou éclairs.",
      L"Kann nur zerstört werden durch Bomben oder Blitze.", L"Só pode ser removida por um bônus especial." };

const std::wstring CONSOLE[CONSOLE_MAX_LINES][N_LANGUAGES]={
    {L"FreeTumble", L"FreeTumble", L"FreeTumble", L"FreeTumble"},
    {L"By Seby and Suiland (2009)", L"Par Seby et Suiland (2009)", L"Von Seby und Suiland (2009)", L"Por Seby e Suiland (2009)"},
    {L"Maintained by Akien (2015-2016)", L"Maintenu par Akien (2015-2016)", L"Weiterentwickelt von Akien (2015-2016)", L"Mantido por Akien (2015-2016)"},
    {L"Click a game type to start playing", L"Cliquer sur le type de jeu que vous souhaitez", L"Klicken Sie den gewünschten Spieltyp an", L"Clique em um modo de jogo para começar"},
    {L"Normal: Turn-based game", L"Normal: Jeu au tour par tour", L"Normal: Rundenbasiertes Spiel", L"Normal: jogo por turnos"},
    {L"Motion: Real-time game", L"Motion: Jeu en temps réel", L"Motion: Echtzeitspiel", L"Motion: jogo em tempo real"},
    {L"Classic: Clear the grid", L"Classic: Videz la grille", L"Classic: Räumen Sie das Feld leer", L"Classic: limpe o tabuleiro"},
    {L"Instructions", L"Instructions", L"Spielanleitung", L"Instruções"},
    {L"Options", L"Options", L"Optionen", L"Opções"},
    {L"Credits", L"Crédits", L"Credits", L"Créditos"},
    {L"Quit the game", L"Quitter le jeu", L"Spiel beenden", L"Sair do jogo"} };

#endif // LANGUAGES_H_INCLUDED
