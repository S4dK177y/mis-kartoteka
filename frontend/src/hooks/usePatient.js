import { useState, useCallback } from 'react';
import { api } from '../api';

export function usePatient(patientId) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPatient = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPatient(patientId);
      setPatient(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ошибка при загрузке данных пациента');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const deletePatient = async () => {
    try {
      await api.deletePatient(patientId);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const uploadDocument = async (file) => {
    setUploading(true);
    try {
      await api.uploadDocument(patientId, file);
      await fetchPatient();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (docId) => {
    try {
      await api.deleteDocument(docId);
      await fetchPatient();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const transferPatient = async (toDepartment, transferDate) => {
    try {
      await api.transferPatient(patientId, toDepartment, transferDate);
      await fetchPatient();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const dischargePatient = async (dischargeData) => {
    try {
      await api.updatePatient(patientId, {
        status: 'Выписан',
        dischargeDate: dischargeData.date,
        dischargeDestination: dischargeData.destination,
        finalDiagnosis: dischargeData.finalDiagnosis
      });
      await fetchPatient();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return {
    patient,
    loading,
    uploading,
    error,
    fetchPatient,
    deletePatient,
    uploadDocument,
    deleteDocument,
    transferPatient,
    dischargePatient
  };
}
