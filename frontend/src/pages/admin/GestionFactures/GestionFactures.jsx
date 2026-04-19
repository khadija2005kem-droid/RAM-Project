import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import { normalizeInvoiceStatus } from "../../../utils/invoiceStatus";
import "./GestionFactures.css";

function GestionFactures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [validatingIds, setValidatingIds] = useState([]);
  const messageTimeoutRef = useRef(null);

  const resetMessageTimer = useCallback((clearMessage) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = setTimeout(() => {
      clearMessage();
      messageTimeoutRef.current = null;
    }, 4000);
  }, []);

  const showSuccessMessage = useCallback(
    (message) => {
      setErrorMessage("");
      setSuccessMessage(message);
      resetMessageTimer(() => setSuccessMessage(""));
    },
    [resetMessageTimer]
  );

  const showErrorMessage = useCallback(
    (message) => {
      setSuccessMessage("");
      setErrorMessage(message);
      resetMessageTimer(() => setErrorMessage(""));
    },
    [resetMessageTimer]
  );

  const loadPendingFactures = useCallback(async () => {
    const result = await api.adminFacturesAll();

    const pendingFactures = (result?.data || [])
      .map((facture) => {
        const normalizedStatus = normalizeInvoiceStatus(facture.status);

        return {
          id: facture.id,
          nom: facture?.user?.nom || "",
          prenom: facture?.user?.prenom || "",
          email: facture?.user?.email || "",
          reference: facture.reference || "",
          montant: Number(facture.prix) || 0,
          normalizedStatus,
          statut: "En attente",
        };
      })
      .filter((facture) => facture.normalizedStatus === "pending");

    setFactures(pendingFactures);
    return pendingFactures;
  }, []);

  useEffect(() => {
    const fetchFactures = async () => {
      try {
        await loadPendingFactures();
      } catch (error) {
        console.log("Admin factures fetch error:", error);
        showErrorMessage("Erreur lors du chargement des factures.");
      } finally {
        setLoading(false);
      }
    };

    fetchFactures();
  }, [loadPendingFactures, showErrorMessage]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const handleAccept = async (id) => {
    if (validatingIds.includes(id)) return;

    try {
      setSuccessMessage("");
      setErrorMessage("");
      setValidatingIds((prev) => [...prev, id]);

      const latestPendingFactures = await loadPendingFactures();
      const targetFacture = latestPendingFactures.find((facture) => facture.id === id);

      if (!targetFacture || targetFacture.normalizedStatus !== "pending") {
        showErrorMessage("Erreur lors de la validation du paiement.");
        return;
      }

      const result = await api.adminValidateFacture(id);

      if (result?.status) {
        setFactures((prev) => prev.filter((facture) => facture.id !== id));
        showSuccessMessage("Paiement validé avec succès.");
      }
    } catch (error) {
      console.log("Admin facture validate error:", error);

      if (error?.status === 422) {
        try {
          await loadPendingFactures();
        } catch (refreshError) {
          console.log("Admin factures refresh error:", refreshError);
        }
      }

      showErrorMessage("Erreur lors de la validation du paiement.");
    } finally {
      setValidatingIds((prev) => prev.filter((factureId) => factureId !== id));
    }
  };

  return (
    <div className="factures-container">
      <h1>Gestion des Factures</h1>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error">{errorMessage}</div>}

      <table className="factures-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Email</th>
            <th>Référence</th>
            <th>Montant (DH)</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {!loading && factures.length === 0 ? (
            <tr>
              <td colSpan="8">Aucune facture à valider.</td>
            </tr>
          ) : (
            factures.map((facture) => (
              <tr key={facture.id}>
                <td>{facture.id}</td>
                <td>{facture.nom}</td>
                <td>{facture.prenom}</td>
                <td>{facture.email}</td>
                <td>{facture.reference}</td>
                <td>{facture.montant}</td>
                <td>{facture.statut}</td>
                <td>
                  <button
                    className="btn-simple"
                    onClick={() => handleAccept(facture.id)}
                    disabled={validatingIds.includes(facture.id)}
                  >
                    Valider le paiement
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default GestionFactures;
