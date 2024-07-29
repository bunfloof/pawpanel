import React, { useState, useRef } from 'react';
import { Formik, Form } from 'formik';
import { debounce } from 'debounce';
import * as Yup from 'yup';
import SpinnerField from '@/components/elements/SpinnerField';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface ServerSettings {
    serverName: string;
    playerSlots: string;
    subdomain: string;
    worldName: string;
    startupServerJar: string;
}

const validationSchema = Yup.object().shape({
    serverName: Yup.string().required('Server name is required'),
    playerSlots: Yup.string()
        .required('Player slots is required')
        .test('is-number', 'Must be a number', (value) => !isNaN(Number(value)))
        .test('min-value', 'Must be at least 1', (value) => Number(value) >= 1),
    subdomain: Yup.string(),
    worldName: Yup.string().required('World name is required'),
    startupServerJar: Yup.string().required('Startup server jar is required'),
});

const MinecraftControlPanel: React.FC = () => {
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:settings');
    const _uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const initialValues: ServerSettings = {
        serverName: 'Minecraft Server 1',
        playerSlots: '16',
        subdomain: '',
        worldName: 'world',
        startupServerJar: 'server.jar',
    };

    const debouncedSetServerSetting = useRef<{ [key: string]: (value: string) => void }>({});

    return (
        <div className='container mx-auto p-6 bg-gray-100'>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={(values) => console.log(values)}
            >
                {({ values, setFieldValue, validateField, setFieldError }) => (
                    <Form>
                        <table className='w-full bg-white shadow-md rounded'>
                            <tbody>
                                {/* ... (keep the server control buttons row as it was) */}
                                {Object.entries(values).map(([key, value]) => {
                                    if (!debouncedSetServerSetting.current[key]) {
                                        debouncedSetServerSetting.current[key] = debounce(async (newValue: string) => {
                                            setLoading((prev) => ({ ...prev, [key]: true }));
                                            clearFlashes();

                                            try {
                                                await validateField(key);
                                                await validationSchema.validateAt(key, { ...values, [key]: newValue });

                                                // blah temp blah
                                                const mockApiCall = new Promise((resolve) => setTimeout(resolve, 1000));

                                                await mockApiCall;
                                                console.log(`Setting changed: ${key} = ${newValue}`);
                                            } catch (error) {
                                                if (error instanceof Yup.ValidationError) {
                                                    setFieldError(key, error.message);
                                                    console.log(`Validation failed for ${key}: ${error.message}`);
                                                } else if (error instanceof Error) {
                                                    clearAndAddHttpError(error);
                                                }
                                            } finally {
                                                setLoading((prev) => ({ ...prev, [key]: false }));
                                            }
                                        }, 750);
                                    }

                                    return (
                                        <tr key={key}>
                                            <th className='p-2 text-left'>{key}</th>
                                            <td className='p-2'>
                                                <SpinnerField
                                                    id={key}
                                                    name={key}
                                                    type='text'
                                                    as={key === 'worldName' ? 'textarea' : 'input'}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                                                    ) => {
                                                        const newValue = e.target.value;
                                                        setFieldValue(key, newValue);
                                                        debouncedSetServerSetting.current[key](newValue);
                                                    }}
                                                    isLoading={loading[key]}
                                                    value={value}
                                                />
                                            </td>
                                            <td className='p-2 hintRow'>
                                                {key === 'worldName' && (
                                                    <a className='hint' data-content='Leave empty for "world"'>
                                                        <img
                                                            className='hintIcon'
                                                            src='/themes/flat/images/icons/hint.png'
                                                            alt=''
                                                        />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default MinecraftControlPanel;
