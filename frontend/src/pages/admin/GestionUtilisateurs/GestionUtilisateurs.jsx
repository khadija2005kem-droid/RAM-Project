import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { clearAuthSession } from "../../../utils/auth";
import { getErrorMessage, isUnauthorizedError } from "../../../utils/errorHandling";
import "./GestionUtilisateurs.css";

function GestionUtilisateurs() {
  const navigate = useNavigate();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setErrorMessage("");
        const result = await api.adminUsersAll();

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

        if (isUnauthorizedError(error)) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }

        setErrorMessage(
          getErrorMessage(error, {
            networkMessage: "Impossible de charger la liste des utilisateurs.",
            serverMessage: "Impossible de charger la liste des utilisateurs.",
            fallbackMessage: "Impossible de charger la liste des utilisateurs.",
          })
        );
      }
    };

    fetchUsers();
  }, [navigate]);

  const utilisateursFiltres = utilisateurs.filter(
    (user) =>
      user.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      user.prenom.toLowerCase().includes(recherche.toLowerCase()) ||
      user.email.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="factures-container">
      <h1>Gestion des Utilisateurs</h1>

      {errorMessage && <div className="error">{errorMessage}</div>}

      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher par nom, prenom ou email..."
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
            <th>Prenom</th>
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
                {errorMessage || "Aucun utilisateur trouve"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default GestionUtilisateurs;
