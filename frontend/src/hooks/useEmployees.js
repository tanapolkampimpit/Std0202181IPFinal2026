import { useCallback, useEffect, useRef, useState } from 'react';

export default function useEmployees(api) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const revision = useRef(0);
  const mounted = useRef(true);
  const reload = useCallback(async () => {
    const version = ++revision.current;
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/employees');
      if (mounted.current && version === revision.current) setEmployees(data);
      return data;
    } catch (failure) {
      if (mounted.current && version === revision.current) setError(failure.message);
      throw failure;
    } finally { if (mounted.current && version === revision.current) setLoading(false); }
  }, [api]);
  useEffect(() => {
    mounted.current = true;
    reload().catch(() => {});
    return () => { mounted.current = false; revision.current += 1; };
  }, [reload]);

  async function mutate(path, options, update, message) {
    if (lock.current) throw new Error('Please wait for the current change to finish.');
    lock.current = true;
    revision.current += 1; // Ignore any older in-flight list response.
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api(path, options);
      if (!mounted.current) return result;
      // Apply the server-confirmed change before refreshing, so a failed refresh
      // cannot leave summary counts displaying the previous employee array.
      setEmployees((current) => update(current, result));
      setNotice(message);
      try { await reload(); }
      catch { if (mounted.current) setError('The change was saved, but the list could not refresh. Please retry.'); }
      return result;
    } catch (failure) { if (mounted.current) setError(failure.message); throw failure; }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return {
    employees, loading, busy, error, notice, reload,
    add: (value) => mutate('/api/employees', { method: 'POST', body: value }, (current, created) => [...current, created], 'Employee added successfully.'),
    update: (employee, value) => mutate(`/api/employees/${encodeURIComponent(employee.id)}`, { method: 'PUT', body: value }, (current, updated) => current.map((item) => item.id === updated.id ? updated : item), 'Employee updated successfully.'),
    toggle: (employee) => mutate(`/api/employees/${encodeURIComponent(employee.id)}/status`, { method: 'PUT' }, (current, updated) => current.map((item) => item.id === updated.id ? updated : item), 'Employee status updated.'),
    remove: (employee) => mutate(`/api/employees/${encodeURIComponent(employee.id)}`, { method: 'DELETE' }, (current) => current.filter((item) => item.id !== employee.id), 'Employee deleted successfully.'),
  };
}
