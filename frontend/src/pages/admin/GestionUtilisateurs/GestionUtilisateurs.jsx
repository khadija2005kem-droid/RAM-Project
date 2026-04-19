import React, { useEffect, useState } from "react";
import "./GestionUtilisateurs.css";
import { getAuthToken } from "../../../utils/auth";

function GestionUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch("http://localhost:8000/api/admin/users?role=client", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Failed to load users");
        }

        const mappedUsers = (result?.data || [])
          .filter((user) => user.role === "client")
          .map((user) => ({
            id: user.id,
            nom: user.nom || "",
            prenom: user.prenom || "",
            email: user.email || "",
          }));

        setUtilisateurs(mappedUsers);
      } catch (error) {
        console.log("Admin users fetch error:", error);
      }
    };

    fetchUsers();
  }, []);

  const utilisateursFiltres = utilisateurs.filter(
    (user) =>
      user.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      user.prenom.toLowerCase().includes(recherche.toLowerCase()) ||
      user.email.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="factures-container">
      <h1>Gestion des Utilisateurs</h1>

      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="search-input"
        />
      </div>

      <table className="factures-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Email</th>
          </tr>
        </thead>

        <tbody>
          {utilisateursFiltres.length > 0 ? (
            utilisateursFiltres.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nom}</td>
                <td>{user.prenom}</td>
                <td>{user.email}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="aucune-facture">
                Aucun utilisateur trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default GestionUtilisateurs;
