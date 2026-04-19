import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import "./AjoutFacture.css";

function AjoutFacture() {
  const [clientId, setClientId] = useState("");
  const [client, setClient] = useState({
    nom: "",
    prenom: "",
    email: "",
  });

  const [factures, setFactures] = useState([{ id: 1, description: "", prix: "" }]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [clientLookupError, setClientLookupError] = useState("");
  const [loading, setLoading] = useState(false);
  const messageTimeoutRef = useRef(null);
  const clientLookupTimeoutRef = useRef(null);
  const latestLookupIdRef = useRef(0);

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
      setServerError("");
      setSuccessMessage(message);
      resetMessageTimer(() => setSuccessMessage(""));
    },
    [resetMessageTimer]
  );

  const showErrorMessage = useCallback(
    (message) => {
      setSuccessMessage("");
      setServerError(message);
      resetMessageTimer(() => setServerError(""));
    },
    [resetMessageTimer]
  );

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }

      if (clientLookupTimeoutRef.current) {
        clearTimeout(clientLookupTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!clientId.trim()) {
      setClientLookupError("");
      setClient({
        nom: "",
        prenom: "",
        email: "",
      });
      return;
    }

    if (!/^\d+$/.test(clientId.trim())) {
      setClientLookupError("Client introuvable");
      return;
    }

    if (clientLookupTimeoutRef.current) {
      clearTimeout(clientLookupTimeoutRef.current);
    }

    const lookupId = latestLookupIdRef.current + 1;
    latestLookupIdRef.current = lookupId;

    clientLookupTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await api.adminGetClientById(clientId.trim());

        if (latestLookupIdRef.current !== lookupId) {
          return;
        }

        if (result?.data) {
          setClient((prev) => ({
            ...prev,
            nom: result.data.nom || prev.nom,
            prenom: result.data.prenom || prev.prenom,
            email: result.data.email || prev.email,
          }));
          setClientLookupError("");
          setErrors((prev) => ({ ...prev, email: "" }));
        }
      } catch (error) {
        if (latestLookupIdRef.current !== lookupId) {
          return;
        }

        if (error?.status === 404) {
          setClientLookupError("Client introuvable");
        } else {
          setClientLookupError("Client introuvable");
        }
      }
    }, 450);

    return () => {
      if (clientLookupTimeoutRef.current) {
        clearTimeout(clientLookupTimeoutRef.current);
      }
    };
  }, [clientId]);

  const handleClientIdChange = (e) => {
    setClientId(e.target.value);
    setClientLookupError("");
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClient((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFactureChange = (id, field, value) => {
    setFactures((prev) =>
      prev.map((facture) => (facture.id === id ? { ...facture, [field]: value } : facture))
    );

    const errorKey = `${field}_${id}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const ajouterFacture = () => {
    setFactures((prev) => [...prev, { id: Date.now(), description: "", prix: "" }]);
  };

  const validate = () => {
    const newErrors = {};

    if (!client.email.trim()) {
      newErrors.email = "Email requis";
    }

    factures.forEach((facture) => {
      if (!facture.description.trim()) {
        newErrors[`description_${facture.id}`] = "Description requise";
      }

      if (!facture.prix || Number(facture.prix) <= 0) {
        newErrors[`prix_${facture.id}`] = "Prix requis";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setSuccessMessage("");
    setServerError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      await Promise.all(
        factures.map((facture) =>
          api.adminCreateFacture({
            client_email: client.email.trim(),
            date: today,
            prix: Number(facture.prix),
          })
        )
      );

      showSuccessMessage("Facture envoyée avec succès.");
      setClientId("");
      setClient({ nom: "", prenom: "", email: "" });
      setFactures([{ id: 1, description: "", prix: "" }]);
      setErrors({});
      setClientLookupError("");
    } catch (error) {
      console.error("Admin facture create error:", error);
      showErrorMessage(error?.body?.message || error?.message || "Erreur lors de la création de la facture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="facture-page">
      <div className="facture-wrapper">
        <h1 className="page-title">Création de facture</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-heading">Information client</h2>

            <div className="form-row">
              <label>ID Client</label>
              <div>
                <input
                  type="text"
                  name="client_id"
                  value={clientId}
                  onChange={handleClientIdChange}
                  placeholder="Saisir l'ID du client"
                />
                {clientLookupError && <p className="error">{clientLookupError}</p>}
              </div>
            </div>

            <div className="form-row">
              <label>Nom client</label>
              <div>
                <input
                  type="text"
                  name="nom"
                  value={client.nom}
                  onChange={handleClientChange}
                  placeholder="Saisir le nom du client"
                />
              </div>
            </div>

            <div className="form-row">
              <label>Prénom client</label>
              <div>
                <input
                  type="text"
                  name="prenom"
                  value={client.prenom}
                  onChange={handleClientChange}
                  placeholder="Saisir le prenom du client"
                />
              </div>
            </div>

            <div className="form-row">
              <label>Email client</label>
              <div>
                <input
                  type="email"
                  name="email"
                  value={client.email}
                  onChange={handleClientChange}
                  placeholder="Saisir l'email du client"
                />
                {errors.email && <p className="error">{errors.email}</p>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-top">
              <h2 className="section-heading">Détail de la facture</h2>

              <button type="button" className="add-btn" onClick={ajouterFacture} disabled={loading}>
                + Ajouter une facture
              </button>
            </div>

            {factures.map((facture, index) => (
              <div className="facture-box" key={facture.id}>
                <div className="facture-box-title">Facture {index + 1}</div>

                <div className="form-row">
                  <label>Description</label>
                  <div>
                    <input
                      type="text"
                      value={facture.description}
                      onChange={(e) => handleFactureChange(facture.id, "description", e.target.value)}
                    />
                    {errors[`description_${facture.id}`] && (
                      <p className="error">{errors[`description_${facture.id}`]}</p>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <label>Prix</label>
                  <div>
                    <input
                      type="number"
                      value={facture.prix}
                      onChange={(e) => handleFactureChange(facture.id, "prix", e.target.value)}
                    />
                    {errors[`prix_${facture.id}`] && <p className="error">{errors[`prix_${facture.id}`]}</p>}
                  </div>
                </div>
              </div>
            ))}

            <div className="submit-area">
              <div className="submit-content">
                {successMessage && <div className="success-message">{successMessage}</div>}
                {serverError && <div className="error">{serverError}</div>}

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AjoutFacture;
