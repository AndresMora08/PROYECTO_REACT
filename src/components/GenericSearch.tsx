import React from "react";

interface GenericSearchProps {

    label?: string;

    placeholder?: string;

    value: string;

    onChange: (value: string) => void;

}

const GenericSearch: React.FC<GenericSearchProps> = ({

    label,

    placeholder = "Buscar...",

    value,

    onChange

}) => {

    return (

        <div className="space-y-2">

            {/* LABEL */}
            {
                label && (

                    <label
                        className="
                            block text-sm
                            font-medium text-black
                            dark:text-white
                        "
                    >
                        {label}
                    </label>

                )
            }

            {/* INPUT */}
            <div className="relative">

                <input

                    type="text"

                    value={value}

                    onChange={(e) =>
                        onChange(e.target.value)
                    }

                    placeholder={placeholder}

                    className="
                        w-full rounded-md
                        border border-stroke
                        bg-transparent
                        py-3 pl-4 pr-10
                        outline-none
                        transition
                        focus:border-primary
                        dark:border-strokedark
                        dark:bg-form-input
                        dark:text-white
                    "
                />

                {/* ICONO */}
                <div
                    className="
                        absolute right-4 top-1/2
                        -translate-y-1/2
                        text-gray-400
                    "
                >

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >

                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="
                                M21 21l-4.35-4.35
                                m1.85-5.15
                                a7 7 0 11-14 0
                                a7 7 0 0114 0z
                            "
                        />

                    </svg>

                </div>

            </div>

        </div>

    );

};

export default GenericSearch;