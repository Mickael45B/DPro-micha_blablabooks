@startuml
left to right direction


actor Visiteur
actor Utilisateur
actor Administrateur

package "non authentifié" {
usecase "S'inscrire" as UC01
usecase "Se connecter" as UC02
usecase "Voir 15 livres au hasard" as UC03
}

package "authentifié" {
usecase "gerer son profil" as UC04
   usecase "modifier son mail" as UC05
   usecase "modifier son mot de passe" as UC06
   usecase "modifier son pseudo" as UC07
   usecase "supprimer son compte" as UC08
   usecase "contacter un administrateur" as UC09

usecase "acceder à la page catalogue" as UC10
   usecase "Voir suggestions de livres populaires" as UC11
   usecase "Consulter nouveautés" as UC12
   usecase "Voir livres populaires" as UC13
   usecase "Rechercher par titre" as UC14
   usecase "Rechercher par auteur" as UC15
   usecase "Rechercher par genre" as UC16

usecase "gerer ses avis" as UC17
   usecase "ajouter un avis" as UC18
   usecase "consulter la liste de ses avis" as UC19
   usecase "modifier un de ses avis" as UC20
   usecase "supprimer un de ses avis" as UC21

usecase "accedez à la page deses bibliotheque" as UC22
   usecase "creer une bibliotheque" as UC23
   usecase "consulter la liste de ses bibliotheques" as UC24
      usecase "deplacer un livre d'une bibliotheque à une autre" as UC25
      usecase "supprimer un livre de sa bibliotheque" as UC26
   usecase "supprimer une bibliotheque (sauf "lu" et "favoris") " as UC27
   usecase "modifier le nom de ses bibliotheque" as UC28

usecase "acceder à la page de detail d'un livre" as UC29
   usecase "voir les détails" as UC30
   usecase "voir les avis" as UC31
   usecase "mettre en favoris" as UC32
   usecase "le mettre dans une bibliotheque de son choix" as UC33
}


package administration {
   usecase "acceder à la page d'administration" as UC34
      usecase "gerer les utilisateurs" as UC35
         usecase "modifier le pseudo" as UC36
         usecase "supprimer le compte" as UC37
         usecase "modifier les autorisations" as UC38
      usecase "gerer les livres" as UC39
         usecase "ajouter un livre" as UC40
         usecase "modifier le livre" as UC41
         usecase "supprimer le livre" as UC42
   usecase "repondre aux messages des utilisateurs" as UC43
   usecase "Traiter signalements" as UC44
}

Visiteur --> UC01
Visiteur --> UC02
Visiteur --> UC03

Utilisateur -> Visiteur 

Utilisateur --> UC04
Utilisateur --> UC10
Utilisateur --> UC17
Utilisateur --> UC22
Utilisateur --> UC29



Administrateur --> Utilisateur 
authentifié ..> UC02 : <<include>>
administration ..> UC02 : <<include>>

UC04 <... UC05 : <<extend>>
UC04 <... UC06 : <<extend>>
UC04 <... UC07 : <<extend>>
UC04 <... UC08 : <<extend>>
UC04 <... UC09 : <<extend>>


UC10 <... UC11 : <<extend>>
UC10 <... UC12 : <<extend>>
UC10 <... UC13 : <<extend>>
UC10 <... UC14 : <<extend>>
UC10 <... UC15 : <<extend>>
UC10 <... UC16 : <<extend>>

UC17 <... UC18 : <<extend>>
UC17 <... UC19 : <<extend>>
UC17 <... UC20 : <<extend>>
UC17 <... UC21 : <<extend>>

UC22 <... UC23 : <<extend>>
UC22 <... UC24 : <<extend>>
UC22 <... UC25 : <<extend>>
UC22 <... UC26 : <<extend>>
UC22 <... UC27 : <<extend>>
UC22 <... UC28 : <<extend>>

UC29 <... UC30 : <<extend>>
UC29 <... UC31 : <<extend>>
UC29 <... UC32 : <<extend>>
UC29 <... UC33 : <<extend>>

Administrateur ---> UC34
Administrateur ---> UC43
Administrateur ---> UC44

UC34 <... UC35 : <<extend>>
UC34 <... UC39 : <<extend>>

UC35 <... UC36 : <<extend>>
UC35 <... UC37 : <<extend>>
UC35 <... UC38 : <<extend>>

UC39 <... UC40 : <<extend>>
UC39 <... UC41 : <<extend>>
UC39 <... UC42 : <<extend>>




@enduml