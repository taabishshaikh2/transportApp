import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useAsync = (fn) => {
  const [loading, setLoading] = useState(false);
  const run = useCallback(async (...args) => {
    setLoading(true);
    try { return await fn(...args); }
    finally { setLoading(false); }
  }, [fn]);
  return { loading, run };
};

export const useForm = (initial) => {
  const [form, setForm] = useState(initial);
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target?.value ?? e }));
  const setAll = (data) => setForm(data);
  const reset  = ()     => setForm(initial);
  return { form, set, setAll, reset, setForm };
};

export const useCrud = ({ listFn, createFn, updateFn, deleteFn }) => {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (params) => {
    setLoading(true);
    try {
      const r = await listFn(params);
      setData(r.data.data);
    } catch (e) { toast.error(e.response?.data?.message || 'Load failed'); }
    finally { setLoading(false); }
  }, [listFn]);

  const create = async (form) => {
    await createFn(form);
    toast.success('Created successfully');
    await load();
  };

  const update = async (id, form) => {
    await updateFn(id, form);
    toast.success('Updated successfully');
    await load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await deleteFn(id);
    toast.success('Deleted');
    await load();
  };

  return { data, loading, load, create, update, remove };
};
