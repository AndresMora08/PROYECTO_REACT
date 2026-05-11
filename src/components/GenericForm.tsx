import React, {
    useEffect,
    useState
} from "react";

import * as Yup from "yup";

interface Field {

    name: string;

    label: string;

    type: string;

    options?: string[];

}

interface GenericFormProps {

    fields: Field[];

    buttonLabel: string;

    onSubmit: (data: Record<string, any>) => void;

    initialValues?: Record<string, any>;

}

// 🔹 VALIDACIÓN SOLO EMAIL
const emailSchema = Yup.string()
    .email("Correo inválido")
    .required("El correo es obligatorio");

const GenericForm: React.FC<GenericFormProps> = ({
    fields,
    buttonLabel,
    onSubmit,
    initialValues = {}
}) => {

    const [formData, setFormData] = useState<Record<string, any>>(initialValues);

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {

        setFormData((prev) => {
            if (Object.keys(prev).length === 0 && Object.keys(initialValues).length > 0) {
                return initialValues;
            }
            return prev;
        });

    }, [initialValues]);

    // 🔹 CAMBIO DE VALORES + VALIDACIÓN EMAIL EN TIEMPO REAL
    const handleChange = async (
        name: string,
        value: any
    ) => {

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        // 🔥 VALIDAR SOLO EMAIL
        if (name === "email") {

            try {

                await emailSchema.validate(value);

                setErrors((prev) => ({
                    ...prev,
                    email: ""
                }));

            } catch (err: any) {

                setErrors((prev) => ({
                    ...prev,
                    email: err.message
                }));

            }

        }

    };

    // 🔹 SUBMIT CON VALIDACIÓN FINAL
    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        try {

            await emailSchema.validate(formData.email);

            setErrors({});

            onSubmit(formData);

        } catch (err: any) {

            setErrors({
                email: err.message
            });

        }

    };

    return (

        <form
            onSubmit={handleSubmit}
            className="
                rounded-lg border border-stroke
                bg-white p-6 shadow-default
                dark:border-strokedark
                dark:bg-boxdark
            "
        >

            {/* CAMPOS */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {fields.map((field) => (

                    <div
                        key={field.name}
                        className={
                            field.name === "email"
                                ? "md:col-span-2"
                                : ""
                        }
                    >

                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">

                            {field.label}

                        </label>

                        {field.type === "select" ? (

                            <select

                                value={formData[field.name] || ""}

                                onChange={(e) =>
                                    handleChange(
                                        field.name,
                                        e.target.value
                                    )
                                }

                                className="
                                    w-full rounded-md border border-stroke
                                    bg-transparent py-3 px-4 outline-none
                                    transition focus:border-primary
                                    dark:border-strokedark
                                    dark:bg-form-input
                                    dark:text-white
                                "
                            >

                                {field.options?.map((option) => (

                                    <option
                                        key={option}
                                        value={option}
                                    >
                                        {option}
                                    </option>

                                ))}

                            </select>

                        ) : (

                            <input

                                type={field.type}

                                value={formData[field.name] ?? ""}

                                onChange={(e) =>
                                    handleChange(
                                        field.name,
                                        e.target.value
                                    )
                                }

                                className="
                                    w-full rounded-md border border-stroke
                                    bg-transparent py-3 px-4 outline-none
                                    transition focus:border-primary
                                    dark:border-strokedark
                                    dark:bg-form-input
                                    dark:text-white
                                "
                            />

                        )}

                        {/* 🔴 ERROR EMAIL */}
                        {field.name === "email" && errors.email && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.email}
                            </p>
                        )}

                    </div>

                ))}

            </div>

            {/* BOTONES */}
            <div className="mt-6 flex justify-end gap-3">

                <button
                    type="submit"
                    className="
                        rounded-md bg-green-700
                        px-5 py-2 text-sm font-medium text-white
                        transition hover:bg-green-800
                    "
                >
                    {buttonLabel}
                </button>

            </div>

        </form>

    );

};

export default GenericForm;