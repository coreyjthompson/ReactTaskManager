import React, { useEffect } from 'react';
import { Button, Form, FloatingLabel } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import api from '../services/api';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done'];

// Yup schema
const schema = yup.object({
    title: yup.string().trim().required('Title is required'),
    description: yup.string().trim().nullable(),
    status: yup.string().oneOf(STATUS_OPTIONS, 'Invalid status').required(),
    // keep as string (YYYY-MM-DD). We'll convert on submit.
    dueDate: yup.string().nullable().transform(v => (v === '' ? null : v)),
});

export default function TaskForm({ id, onSave, onCancel, initialTask }) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: '',
            description: '',
            status: initialTask?.status || 'To Do',
            dueDate: null, // 'YYYY-MM-DD' or null
        },
    });

    // Load for edit
    useEffect(() => {
        let ignore = false;

        async function load() {
            if (!id) {
                // If creating and parent passed an initial status, apply it
                if (initialTask?.status) {
                    reset(prev => ({ ...prev, status: initialTask.status }));
                }
                return;
            }
            try {
                const res = await api.get(`tasks/${id}`);
                if (ignore) return;

                const t = res.data;
                reset({
                    title: t.title ?? '',
                    description: t.description ?? '',
                    status: STATUS_OPTIONS.includes(t.status) ? t.status : 'To Do',
                    // convert ISO -> 'YYYY-MM-DD'
                    dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : null,
                });
            } catch (e) {
                console.error(e);
            }
        }

        load();
        return () => { ignore = true; };
    }, [id, reset, initialTask]);

    // Submit handler
    const onSubmit = async (data) => {
        // Convert form date string → ISO (or null)
        const payload = {
            title: data.title.trim(),
            description: data.description?.trim() || null,
            status: data.status,
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
            id: id ?? undefined,
        };

        try {
            const res = id
                ? await api.put(`tasks/${id}`, payload)
                : await api.post('tasks', payload);

            toast.success(id ? 'Task updated' : 'Task created');
            if (onSave) {
                onSave(res.data ?? payload);
            }

        } catch (err) {
            const msg =
                err?.response?.data?.title ||
                err?.response?.data?.message ||
                (typeof err?.response?.data === 'string' ? err.response.data : null) ||
                err?.message ||
                'Request failed';
            toast.error(msg);
        }
    };

    return (
        <Form noValidate onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
                <FloatingLabel controlId="floatingTaskTitle" label="Title">
                    <Form.Control
                        type="text"
                        placeholder="Title"
                        isInvalid={!!errors.title}
                        {...register('title')}
                    />
                    <Form.Control.Feedback type="invalid">
                        {errors.title?.message}
                    </Form.Control.Feedback>
                </FloatingLabel>
            </Form.Group>

            <Form.Group className="mb-3">
                <FloatingLabel controlId="floatingTaskDescription" label="Add a short description">
                    <Form.Control
                        as="textarea"
                        placeholder="Add a short description"
                        style={{ height: '100px' }}
                        isInvalid={!!errors.description}
                        {...register('description')}
                    />
                    <Form.Control.Feedback type="invalid">
                        {errors.description?.message}
                    </Form.Control.Feedback>
                </FloatingLabel>
            </Form.Group>

            <Form.Group className="mb-3">
                <FloatingLabel controlId="floatingTaskDate" label="Due Date">
                    <Form.Control
                        type="date"
                        placeholder="Due date"
                        isInvalid={!!errors.dueDate}
                        {...register('dueDate')}
                    />
                    <Form.Control.Feedback type="invalid">
                        {errors.dueDate?.message}
                    </Form.Control.Feedback>
                </FloatingLabel>
            </Form.Group>

            <Form.Group className="mb-3">
                <FloatingLabel controlId="floatingSelect" label="Choose a status">
                    <Form.Select
                        className="form-select"
                        isInvalid={!!errors.status}
                        {...register('status')}
                    >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                        {errors.status?.message}
                    </Form.Control.Feedback>
                </FloatingLabel>
            </Form.Group>

            <Form.Group className="text-end">
                <Button
                    type="button"
                    variant="secondary"
                    className="me-2"
                    onClick={() => onCancel && onCancel()}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {id ? 'Update' : 'Create'}
                </Button>
            </Form.Group>
        </Form>
    );
}
