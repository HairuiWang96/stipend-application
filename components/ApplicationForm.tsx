'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationSchema, ApplicationSchemaType } from '@/lib/schemas/applicationSchema';
import { ApplicationResponse } from '@/lib/types';
import { useState } from 'react';

interface ApplicationFormProps {
    onSuccess: (response: ApplicationResponse) => void;
}

const US_STATES = [
    'AL',
    'AK',
    'AZ',
    'AR',
    'CA',
    'CO',
    'CT',
    'DE',
    'FL',
    'GA',
    'HI',
    'ID',
    'IL',
    'IN',
    'IA',
    'KS',
    'KY',
    'LA',
    'ME',
    'MD',
    'MA',
    'MI',
    'MN',
    'MS',
    'MO',
    'MT',
    'NE',
    'NV',
    'NH',
    'NJ',
    'NM',
    'NY',
    'NC',
    'ND',
    'OH',
    'OK',
    'OR',
    'PA',
    'RI',
    'SC',
    'SD',
    'TN',
    'TX',
    'UT',
    'VT',
    'VA',
    'WA',
    'WV',
    'WI',
    'WY',
    'DC',
];

export default function ApplicationForm({ onSuccess }: ApplicationFormProps) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSSN, setShowSSN] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ApplicationSchemaType>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            agreementAccepted: false,
        },
    });

    const onSubmit = async (data: ApplicationSchemaType) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'stipend-api-key-2026',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit application');
            }

            const result: ApplicationResponse = await response.json();
            onSuccess(result);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {submitError && <div className='p-4 bg-red-100 border border-red-400 text-red-700 rounded'>{submitError}</div>}

            {/* Applicant Information Section */}
            <fieldset className='border p-4 rounded'>
                <legend className='text-lg font-semibold px-2'>Applicant Information</legend>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                    {/* First Name */}
                    <div>
                        <label htmlFor='firstName' className='block text-sm font-medium mb-1'>
                            First Name *
                        </label>
                        <input id='firstName' type='text' {...register('firstName')} className='w-full border rounded px-3 py-2' />
                        {errors.firstName && <p className='text-red-600 text-sm mt-1'>{errors.firstName.message}</p>}
                    </div>

                    {/* Last Name */}
                    <div>
                        <label htmlFor='lastName' className='block text-sm font-medium mb-1'>
                            Last Name *
                        </label>
                        <input id='lastName' type='text' {...register('lastName')} className='w-full border rounded px-3 py-2' />
                        {errors.lastName && <p className='text-red-600 text-sm mt-1'>{errors.lastName.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor='email' className='block text-sm font-medium mb-1'>
                            Email *
                        </label>
                        <input id='email' type='email' {...register('email')} className='w-full border rounded px-3 py-2' />
                        {errors.email && <p className='text-red-600 text-sm mt-1'>{errors.email.message}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor='phone' className='block text-sm font-medium mb-1'>
                            Phone Number *
                        </label>
                        <input id='phone' type='tel' placeholder='(555) 123-4567' {...register('phone')} className='w-full border rounded px-3 py-2' />
                        {errors.phone && <p className='text-red-600 text-sm mt-1'>{errors.phone.message}</p>}
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label htmlFor='dateOfBirth' className='block text-sm font-medium mb-1'>
                            Date of Birth *
                        </label>
                        <input id='dateOfBirth' type='date' {...register('dateOfBirth')} className='w-full border rounded px-3 py-2' />
                        {errors.dateOfBirth && <p className='text-red-600 text-sm mt-1'>{errors.dateOfBirth.message}</p>}
                    </div>

                    {/* SSN */}
                    <div>
                        <label htmlFor='ssn' className='block text-sm font-medium mb-1'>
                            Social Security Number *
                        </label>
                        <div className='relative'>
                            <input id='ssn' type={showSSN ? 'text' : 'password'} placeholder='XXX-XX-XXXX' autoComplete='off' {...register('ssn')} className='w-full border rounded px-3 py-2 pr-10' />
                            <button type='button' onClick={() => setShowSSN(!showSSN)} className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1' aria-label={showSSN ? 'Hide SSN' : 'Show SSN'}>
                                {showSSN ? (
                                    <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-5 h-5'>
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            d='M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88'
                                        />
                                    </svg>
                                ) : (
                                    <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-5 h-5'>
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            d='M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z'
                                        />
                                        <path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.ssn && <p className='text-red-600 text-sm mt-1'>{errors.ssn.message}</p>}
                        <p className='text-gray-500 text-xs mt-1'>Format: XXX-XX-XXXX or XXXXXXXXX</p>
                    </div>
                </div>

                {/* Address Section */}
                <div className='mt-4 space-y-4'>
                    <div>
                        <label htmlFor='addressLine1' className='block text-sm font-medium mb-1'>
                            Address Line 1 *
                        </label>
                        <input id='addressLine1' type='text' {...register('addressLine1')} className='w-full border rounded px-3 py-2' />
                        {errors.addressLine1 && <p className='text-red-600 text-sm mt-1'>{errors.addressLine1.message}</p>}
                    </div>

                    <div>
                        <label htmlFor='addressLine2' className='block text-sm font-medium mb-1'>
                            Address Line 2
                        </label>
                        <input id='addressLine2' type='text' {...register('addressLine2')} className='w-full border rounded px-3 py-2' />
                        {errors.addressLine2 && <p className='text-red-600 text-sm mt-1'>{errors.addressLine2.message}</p>}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div>
                            <label htmlFor='city' className='block text-sm font-medium mb-1'>
                                City *
                            </label>
                            <input id='city' type='text' {...register('city')} className='w-full border rounded px-3 py-2' />
                            {errors.city && <p className='text-red-600 text-sm mt-1'>{errors.city.message}</p>}
                        </div>

                        <div>
                            <label htmlFor='state' className='block text-sm font-medium mb-1'>
                                State *
                            </label>
                            <select id='state' {...register('state')} className='w-full border rounded px-3 py-2'>
                                <option value=''>Select State</option>
                                {US_STATES.map(state => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                            {errors.state && <p className='text-red-600 text-sm mt-1'>{errors.state.message}</p>}
                        </div>

                        <div>
                            <label htmlFor='zipCode' className='block text-sm font-medium mb-1'>
                                ZIP Code *
                            </label>
                            <input id='zipCode' type='text' maxLength={5} {...register('zipCode')} className='w-full border rounded px-3 py-2' />
                            {errors.zipCode && <p className='text-red-600 text-sm mt-1'>{errors.zipCode.message}</p>}
                        </div>
                    </div>
                </div>
            </fieldset>

            {/* Program Information Section */}
            <fieldset className='border p-4 rounded'>
                <legend className='text-lg font-semibold px-2'>Program Information</legend>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                    <div>
                        <label htmlFor='programName' className='block text-sm font-medium mb-1'>
                            Program Name *
                        </label>
                        <input id='programName' type='text' {...register('programName')} className='w-full border rounded px-3 py-2' />
                        {errors.programName && <p className='text-red-600 text-sm mt-1'>{errors.programName.message}</p>}
                    </div>

                    <div>
                        <label htmlFor='amountRequested' className='block text-sm font-medium mb-1'>
                            Amount Requested ($) *
                        </label>
                        <input id='amountRequested' type='number' min='1' step='0.01' {...register('amountRequested', { valueAsNumber: true })} className='w-full border rounded px-3 py-2' />
                        {errors.amountRequested && <p className='text-red-600 text-sm mt-1'>{errors.amountRequested.message}</p>}
                    </div>
                </div>

                <div className='mt-4'>
                    <label className='flex items-start gap-2'>
                        <input type='checkbox' {...register('agreementAccepted')} className='mt-1' />
                        <span className='text-sm'>I agree to the terms and conditions of this stipend application. I certify that all information provided is accurate and complete. *</span>
                    </label>
                    {errors.agreementAccepted && <p className='text-red-600 text-sm mt-1'>{errors.agreementAccepted.message}</p>}
                </div>
            </fieldset>

            <button type='submit' disabled={isSubmitting} className='w-full bg-blue-600 text-white py-3 px-4 rounded font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed'>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
        </form>
    );
}
