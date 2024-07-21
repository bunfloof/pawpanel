import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import { useStoreState } from 'easy-peasy';
import { Formik, Form, Field } from 'formik';
import { object, string } from 'yup';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const [activeTab, setActiveTab] = useState('login');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();

        const desiredTitle = 'PawPanel';
        const desiredFaviconHref = '/multicraft/favicon.ico';

        document.title = desiredTitle;

        const existingFavicons = document.querySelectorAll("link[rel*='icon']");
        existingFavicons.forEach((favicon) => favicon.remove());

        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = `${desiredFaviconHref}?v=${new Date().getTime()}`;
        document.head.appendChild(link);
    }, []);

    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab);
            clearFlashes();
        },
        [clearFlashes]
    );

    const onSubmit = (values: Values, { setSubmitting }: any) => {
        clearFlashes();

        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }
                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);
                setToken('');
                if (ref.current) ref.current.reset();
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <>
                        <br /> <span className='tracking-[-0.020em]'>Welcome to </span>
                        <b>
                            <a href='https://foxomy.com/'>PawPanel</a>
                        </b>
                        <span className='tracking-[-0.020em]'>, the Minecraft server control panel.</span>
                        <br />
                        <div className='introbar'>
                            <a onClick={() => handleTabChange('login')} style={{ cursor: 'pointer' }}>
                                <img className='inline' src='/multicraft/login_large.png' alt='' /> <span>Login</span>
                            </a>
                            <a
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent the default link behavior
                                    const isConfirmed = window.confirm(
                                        'You are leaving your control panel.\n\nYou will be forwarded to the documentation on the official Foxomy website.'
                                    );
                                    if (isConfirmed) {
                                        window.location.href =
                                            'https://foxomy.com/billing/submitticket.php?step=2&deptid=2';
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <img className='inline' src='/multicraft/help_large.png' alt='' /> <span>Help</span>
                            </a>
                            <a onClick={() => handleTabChange('about')} style={{ cursor: 'pointer' }}>
                                <img className='inline' src='/multicraft/about_large.png' alt='' /> <span>About</span>
                            </a>
                        </div>
                    </>
                );
            case 'support':
                return (
                    <span>
                        {' '}
                        If you have questions regarding our server management software or if you find a bug please
                        contact us using this{' '}
                        <a href='https://foxomy.com/billing/submitticket.php?step=2&deptid=2'>form</a> or by sending an
                        email to <a href='mailto:support@foxomy.com'>support@foxomy.com</a>.<br /> In case this is a bug
                        report please include all the error messages you encountered and a short description of how to
                        reproduce the bug.
                    </span>
                );
            case 'login':
            default:
                return (
                    <div className='form'>
                        <FlashMessageRender className='mb-[15px]' />
                        <Formik
                            onSubmit={onSubmit}
                            initialValues={{ username: '', password: '' }}
                            validationSchema={object().shape({
                                username: string().required('A username or email must be provided.'),
                                password: string().required('Please enter your account password.'),
                            })}
                        >
                            {({ isSubmitting, setSubmitting, submitForm, errors, touched }) => (
                                <Form id='login-form'>
                                    <div className='form-group'>
                                        <label htmlFor='LoginForm_name' className='required'>
                                            Name <span className='required'>*</span>
                                        </label>
                                        <Field
                                            name='username'
                                            id='LoginForm_name'
                                            type='text'
                                            maxLength='128'
                                            className='form-control'
                                        />
                                        {errors.username && touched.username && (
                                            <div className='error'>{errors.username}</div>
                                        )}
                                    </div>
                                    <div className='form-group'>
                                        <label htmlFor='LoginForm_password' className='required'>
                                            Password <span className='required'>*</span>
                                        </label>
                                        <Field
                                            name='password'
                                            id='LoginForm_password'
                                            type='password'
                                            maxLength='128'
                                            className='form-control'
                                        />
                                        {errors.password && touched.password && (
                                            <div className='error'>{errors.password}</div>
                                        )}
                                    </div>
                                    <div className='mt-[15px] mb-[15px]'>
                                        <Link
                                            to='/auth/password'
                                            className='text-xs text-neutral-500 tracking-wide no-underline hover:text-neutral-600'
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Button
                                        type='submit'
                                        className='btn btn-primary btn-block'
                                        isLoading={isSubmitting}
                                        disabled={isSubmitting}
                                    >
                                        Login
                                    </Button>
                                    {recaptchaEnabled && (
                                        <Reaptcha
                                            ref={ref}
                                            size={'invisible'}
                                            sitekey={siteKey || '_invalid_key'}
                                            onVerify={(response) => {
                                                setToken(response);
                                                submitForm();
                                            }}
                                            onExpire={() => {
                                                setSubmitting(false);
                                                setToken('');
                                            }}
                                        />
                                    )}
                                </Form>
                            )}
                        </Formik>
                    </div>
                );
            case 'about':
                return (
                    <>
                        <div className='text-center flex flex-col items-center'>
                            <h2>About PawPanel</h2>
                            <div className='muted'>
                                {' '}
                                Copyright © 2010-2024 by <a href='http://foxomy.com/'>Foxomy GmbH</a>. All Rights
                                Reserved.
                            </div>
                            <img src='/multicraft/swissmade.png' alt='Swiss Made' />
                        </div>
                        <br /> PawPanel uses the following technologies:
                        <br />
                        <div id='about' className='space-y-4'>
                            {[
                                [
                                    { href: 'http://www.python.org', src: '/multicraft/python.png', alt: 'Python' },
                                    {
                                        href: 'https://github.com/giampaolo/pyftpdlib',
                                        src: '/multicraft/pyftpdlib.png',
                                        alt: 'pyftpdlib',
                                    },
                                ],
                                [
                                    {
                                        href: 'https://github.com/giampaolo/psutil',
                                        src: '/multicraft/psutil.png',
                                        alt: 'psutil',
                                    },
                                    { href: 'http://www.php.net', src: '/multicraft/php.png', alt: 'PHP' },
                                ],
                                [
                                    {
                                        href: 'http://www.yiiframework.com',
                                        src: '/multicraft/yii.png',
                                        alt: 'Yii Framework',
                                    },
                                    { href: 'http://www.net2ftp.com/', src: '/multicraft/net2ftp.png', alt: 'net2ftp' },
                                ],
                                [
                                    {
                                        href: 'http://www.lesscss.org/',
                                        src: '/multicraft/lesscss.png',
                                        alt: 'Less CSS',
                                    },
                                    { href: 'http://www.gulpjs.com/', src: '/multicraft/gulp.png', alt: 'Gulp' },
                                ],
                                [
                                    { href: 'http://www.nodejs.org/', src: '/multicraft/nodejs.png', alt: 'Node.js' },
                                    {
                                        href: 'http://www.getbootstrap.com/',
                                        src: '/multicraft/bootstrap.png',
                                        alt: 'Bootstrap',
                                    },
                                ],
                            ].map((row, rowIndex) => (
                                <div key={rowIndex} className='flex flex-col md:flex-row -mx-2'>
                                    {row.map((item, index) => (
                                        <a
                                            key={index}
                                            href={item.href}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='w-full md:w-1/2 px-2 mt-2.5 pt-2.5 border-t border-solid border-[#cccccc] text-center'
                                        >
                                            <img
                                                src={item.src}
                                                alt={item.alt}
                                                className='max-w-full mx-auto rounded-md'
                                            />
                                        </a>
                                    ))}
                                </div>
                            ))}
                            <div className='mt-2.5 pt-2.5 border-t border-solid border-[#cccccc] text-center'>
                                <a href='http://www.multicraft.org/' target='_blank' rel='noopener noreferrer'>
                                    <img
                                        src='/multicraft/multicraft.png'
                                        alt='Multicraft'
                                        className='max-w-full mx-auto rounded-md'
                                    />
                                </a>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div id='page'>
            <div id='watermark-logo'></div>

            <div id='mini'>
                <div className='row' id='header'>
                    <div id='logo'>
                        <h1>
                            PawPanel<small>Minecraft Server Manager</small>
                        </h1>
                    </div>
                </div>
                <nav className='navbar navbar-default navbar-static-top navbar-inverse' role='navigation' id='navbar'>
                    <div>
                        <ul className='nav navbar-nav' id='yw0'>
                            <li className={activeTab === 'home' ? 'active' : ''}>
                                <a
                                    className='transition-all'
                                    onClick={() => handleTabChange('home')}
                                    style={{ cursor: activeTab === 'home' ? 'default' : 'pointer' }}
                                >
                                    Home
                                </a>
                            </li>
                            <li className={activeTab === 'support' ? 'active' : ''}>
                                <a
                                    className='transition-all'
                                    onClick={() => handleTabChange('support')}
                                    style={{ cursor: activeTab === 'support' ? 'default' : 'pointer ' }}
                                >
                                    Support
                                </a>
                            </li>
                            <li className={activeTab === 'login' ? 'active' : ''}>
                                <a
                                    className='transition-all'
                                    onClick={() => handleTabChange('login')}
                                    style={{ cursor: activeTab === 'login' ? 'default' : 'pointer' }}
                                >
                                    Login
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
                {/* Content */}
                <div className='row' id='content'>
                    {renderContent()}
                </div>
            </div>
            <style>
                {`
                
                
@media screen, projection{     
  body {  
    line-height:1.42857143 !important;
    color:#333333 !important;
  }  
}  
@media screen, projection{ 
  * { 
    box-sizing: border-box !important;
  } 

  body { 
    margin: 0 !important;
  } 

  body { 
    font-family: 'Roboto' !important; 
    font-size: 14px !important; 
    line-height: 1.42857143 !important; 
    color: #333333 !important; 
    background-color: #d9d9d9 !important;
  } 

  body { 
    height: 100% !important;
  } 

  html { 
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0) !important;
  } 

  html { 
    height: 100% !important;
  } 

  #page { 
    min-height: 100% !important; 
    margin-bottom: -79px !important; 
    overflow: auto !important;
  } 

  *,:before,:after { 
    box-sizing: border-box !important;
  } 

  #page:after { 
    content: "" !important; 
    display: block !important; 
    height: 79px !important;
  } 

  #watermark-logo { 
    width: 100% !important; 
    height: 676px !important; 
    position: fixed !important; 
    left: 0 !important; 
    margin: -100px 0 0 !important; 
    background: url('/multicraft/watermark.png') center center no-repeat !important; 
    z-index: -100 !important; 
    opacity: 0.05 !important;
  } 

  #mini { 
    margin: 100px auto 0 !important; 
    width: 400px !important; 
    background: #fff !important; 
    padding: 0 15px !important; 
    border-radius: 8px !important; 
    overflow: hidden !important; 
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important; 
    text-align: center !important;
  } 

  .row { 
    margin-left: -15px !important; 
    margin-right: -15px !important;
  } 

  #header { 
    background-image: -webkit-linear-gradient(top, #2cb2ff 0%, #009df8 100%) !important; 
    background-image: linear-gradient(to bottom, #2cb2ff 0%, #009df8 100%) !important; 
    background-repeat: repeat-x !important; 
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ff2cb2ff', endColorstr='#ff009df8', GradientType=0) !important;
  } 
    
      .col-md-6 { 
    position: relative !important;
    min-height: 1px !important; 
    padding-left: 15px !important;
    padding-right: 15px !important;
  } 

  .row:before,.row:after { 
    content: " " !important; 
    display: table !important;
  } 

  .row:after { 
    clear: both !important;
  } 

  nav { 
    display: block !important;
  } 

  .navbar { 
    position: relative !important; 
    min-height: 50px !important; 
    margin-bottom: 20px !important; 
    border: 1px solid transparent !important;
  } 
}     


  .navbar { 
    border-radius: 4px !important;
  } 


@media screen, projection{ 
  .navbar-static-top { 
    z-index: 1000 !important; 
    border-width: 0 0 1px !important;
  } 
}     


  .navbar-static-top { 
    border-radius: 0 !important;
  } 
   

@media screen, projection{ 
  .navbar-default { 
    background-color: #f8f8f8 !important; 
    border-color: #e7e7e7 !important;
  } 

  .navbar-inverse { 
    background-color: #222222 !important; 
    border-color: #080808 !important;
  } 

  #navbar { 
    margin: 0 -15px !important;
  } 

  .navbar:before,.navbar:after { 
    content: " " !important; 
    display: table !important;
  } 

  .navbar:after { 
    clear: both !important;
  } 

  #content { 
    padding-bottom: 15px !important; 
    position: relative !important; 
    
  } 

  #mini #content  { 
    padding: 15px !important; 
    text-align: left !important;
  } 
}     


  .navbar-header { 
    float: left !important;
  } 


@media screen, projection{ 
  .navbar-header:before,.navbar-header:after { 
    content: " " !important; 
    display: table !important;
  } 

  .navbar-header:after { 
    clear: both !important;
  } 

  .collapse { 
    display: none;
  } 

}     


  .navbar-collapse { 
    width: auto !important; 
    border-top: 0 !important; 
    box-shadow: none !important;
  } 



  

@media screen, projection{ 


  .notice { 
    position: absolute !important; 
    top: 15px !important; 
    right: 15px !important; 
    color: #999999 !important;
  } 

  h1 { 
    font-size: 2em !important; 
    margin: 0.67em 0 !important;
  } 

  h1 { 
    font-family: 'Roboto' !important; 
    font-weight: 300 !important; 
    line-height: 1.1 !important; 
    color: inherit !important;
  } 

  h1 { 
    margin-top: 20px !important; 
    margin-bottom: 10px !important;
  } 

  h1 { 
    font-size: 36px !important;
  } 

  #header h1  { 
    margin: 0 !important; 
    line-height: 2em !important; 
    font-size: 3em !important; 
    padding: 0 1em !important; 
    color: #ffffff !important; 
    position: relative !important; 
    z-index: 0 !important; 
    overflow: hidden !important;
  } 

  #header h1::before { 
    content: "" !important; 
    position: absolute !important; 
    left: -25px !important; 
    top: -25px !important; 
    bottom: -25px !important; 
    width: 100% !important; 
    background: url('/multicraft/watermark.png') no-repeat !important; 
    background-size: contain !important; 
    opacity: 0.3 !important; 
    z-index: -1 !important;
  } 

  button { 
    font-family: inherit !important; 
    font-size: 100% !important; 
    margin: 0 !important;
  } 

  button { 
    line-height: normal !important;
  } 

  button { 
    text-transform: none !important;
  } 

  button { 
    -webkit-appearance: button !important; 
    cursor: pointer !important;
  } 

  button { 
    font-family: inherit !important; 
    font-size: inherit !important; 
    line-height: inherit !important;
  } 

  .navbar-toggle { 
    position: relative !important; 
    float: right !important; 
    margin-right: 15px !important; 
    padding: 9px 10px !important; 
    margin-top: 8px !important; 
    margin-bottom: 8px !important; 
    background-color: transparent !important; 
    background-image: none !important; 
    border: 1px solid transparent !important; 
    border-radius: 4px !important;
  } 
}     


  .navbar-toggle { 
    display: none !important;
  } 


@media screen, projection{ 

  .introbar a img  { 
    margin-top: -4px !important;
    margin-right: 5px !important;
  } 
    
  .navbar-toggle { 
    float: left !important; 
    margin-left: 10px !important; 
    padding: 4px !important;
  } 

  .navbar-default .navbar-toggle  { 
    border-color: #dddddd !important;
  } 

  .navbar-inverse .navbar-toggle  { 
    border-color: #333333 !important;
  } 

  .navbar-inverse .navbar-toggle  { 
    color: #999999 !important;
  } 

  .navbar-default .navbar-toggle:hover { 
    background-color: #dddddd !important;
  } 

  .navbar-inverse .navbar-toggle:hover { 
    background-color: #333333 !important;
  } 

  ul { 
    margin-top: 0 !important; 
    margin-bottom: 10px !important;
  } 


  .navbar-nav { 
    margin: 7.5px -15px !important;
  } 
}     


  .navbar-nav { 
    float: left !important; 
    margin: 0 !important;
  } 
  

@media screen, projection{ 
  #mini .nav  { 
    float: none !important; 
    margin: 0 auto -15px !important; 
    display: inline-block !important;
  } 

  .nav:before,.nav:after { 
    content: " " !important; 
    display: table !important;
  } 

  .nav:after { 
    clear: both !important;
  } 

h2 { 
    font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
    font-weight: 300; 
    line-height: 1.1; 
    color: inherit;
  } 

  h2 { 
    margin-top: 20px; 
    margin-bottom: 10px;
  } 

  h2 { 
    font-size: 30px;
  } 

    .muted { 
    color: #999; 
    font-size: 0.8em;
  } 

  small { 
    font-size: 80% !important;
  } 

  small { 
    font-size: 85% !important;
  } 

  h1 small  { 
    font-weight: normal !important; 
    line-height: 1 !important; 
    color: #999999 !important;
  } 

  h1 small  { 
    font-size: 65% !important;
  } 

  #header h1 small  { 
    color: #eeeeee !important; 
    font-size: 0.4em !important; 
    margin-left: 0.4em !important;
  } 

  #mini #logo small  { 
    display: block !important; 
    margin: -0.5em 0 1em !important;
  } 

  .sr-only { 
    position: absolute !important; 
    width: 1px !important; 
    height: 1px !important; 
    margin: -1px !important; 
    padding: 0 !important; 
    overflow: hidden !important; 
    clip: rect(0, 0, 0, 0) !important; 
    border: 0 !important;
  } 

  img { 
    border: 0 !important;
  } 

  img { 
    vertical-align: middle !important;
  } 

  .nav > li  { 
    position: relative !important; 
    display: block !important;
  } 
}     


  .navbar-nav > li  { 
    float: left !important;
  } 
 

@media screen, projection{ 
  input { 
    font-family: inherit !important; 
    font-size: 100% !important; 
    margin: 0 !important;
  } 

  input { 
    line-height: normal !important;
  } 

  input { 
    font-family: inherit !important; 
    font-size: inherit !important; 
    line-height: inherit !important;
  } 

  .form-group { 
    margin-bottom: 15px !important;
  } 

  .btn { 
    display: inline-block !important; 
    margin-bottom: 0 !important; 
    font-weight: normal !important; 
    text-align: center !important; 
    vertical-align: middle !important; 
    cursor: pointer !important; 
    background-image: none !important; 
    border: 1px solid transparent !important; 
    white-space: nowrap !important; 
    padding: 6px 12px !important; 
    font-size: 14px !important; 
    line-height: 1.42857143 !important; 
    border-radius: 4px !important; 
    -webkit-user-select: none !important; 
    -moz-user-select: none !important; 
    -ms-user-select: none !important; 
    user-select: none !important;
  } 

  .btn-primary { 
    color: #ffffff !important; 
    background-color: #2cb2ff !important; 
    border-color: #13a9ff !important;
  } 

  .btn-block { 
    display: block !important; 
    width: 100% !important; 
    padding-left: 0 !important; 
    padding-right: 0 !important;
  } 

  input[type="submit"] { 
    -webkit-appearance: button !important; 
    cursor: pointer !important;
  } 

  input[type="submit"].btn-block { 
    width: 100% !important;
  } 

  a { 
    background: transparent !important;
  } 

  a { 
    color: #2cb2ff !important; 
    text-decoration: none !important;
  } 

  .nav > li > a  { 
    position: relative !important; 
    display: block !important; 
    padding: 10px 15px !important;
  } 

  .navbar-nav > li > a  { 
    padding-top: 10px !important; 
    padding-bottom: 10px !important; 
    line-height: 20px !important;
  } 
}     


  .navbar-nav > li > a  { 
    padding-top: 15px !important; 
    padding-bottom: 15px !important;
  } 
 

@media screen, projection{ 
  .navbar-default .navbar-nav > li > a  { 
    color: #777777 !important;
  } 

  .navbar-inverse .navbar-nav > li > a  { 
    color: #999999 !important;
  } 

  a:active,a:hover { 
    outline: 0 !important;
  } 

  a:hover { 
    color: #008ddf !important; 
    text-decoration: underline !important;
  } 
    
  .introbar a  { 
    display: block !important;
    font-size: 1.7em !important;
    border-top: 1px solid #dddddd !important; 
    margin: 15px -15px -15px !important;
    line-height: 2.2em !important; 
    font-weight: 300 !important; 
    color: #555555 !important; 
    padding: 0 0 0 30px !important; 
    -webkit-transition: 0.2s !important; 
    transition: 0.2s !important;
  } 

  .introbar a:hover { 
    color: #ffffff !important; 
    background: #2cb2ff !important; 
    text-decoration: none !important;
  } 

  .introbar a:hover { 
    border-color: #2cb2ff !important;
  } 

  .nav > li > a:hover { 
    text-decoration: none !important; 
    background-color: #eeeeee !important;
  } 

  .navbar-default .navbar-nav > li > a:hover { 
    color: #333333 !important; 
    background-color: transparent !important;
  } 

  .navbar-inverse .navbar-nav > li > a:hover { 
    color: #ffffff !important; 
    background-color: transparent !important;
  } 

  .nav > li > a:hover, .nav > li > a:focus { 
    text-decoration: none !important; 
    background-color: #eeeeee !important;
  } 

  .navbar-default .navbar-nav > li > a:hover, .navbar-default .navbar-nav > li > a:focus { 
    color: #333333 !important; 
    background-color: transparent !important;
  } 

  .navbar-inverse .navbar-nav > li > a:hover, .navbar-inverse .navbar-nav > li > a:focus { 
    color: #ffffff !important; 
    background-color: transparent !important;
  } 

  .navbar-default .navbar-nav > .active > a  { 
    color: #555555 !important; 
    background-color: #e7e7e7 !important;
  } 

  .navbar-inverse .navbar-nav > .active > a  { 
    color: #ffffff !important; 
    background-color: #080808 !important;
  } 

  .navbar-default .navbar-nav > .active > a , .navbar-default .navbar-nav > .active > a:hover { 
    color: #555555 !important; 
    background-color: #e7e7e7 !important;
  } 

  .navbar-inverse .navbar-nav > .active > a , .navbar-inverse .navbar-nav > .active > a:hover { 
    color: #ffffff !important; 
    background-color: #080808 !important;
  } 

  label { 
    display: inline-block !important; 
    margin-bottom: 5px !important; 
    font-weight: bold !important;
  } 

  .form-control { 
    display: block !important; 
    width: 100% !important; 
    height: 34px !important; 
    padding: 6px 12px !important; 
    font-size: 14px !important; 
    line-height: 1.42857143 !important; 
    color: #555555 !important; 
    vertical-align: middle !important; 
    background-color: #ffffff !important; 
    background-image: none !important; 
    border: 1px solid #cccccc !important; 
    border-radius: 4px !important; 
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075) !important; 
    -webkit-transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s !important; 
    transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s !important;
  } 

  .col-lg-6 { 
    position: relative !important; 
    min-height: 1px !important; 
    padding-left: 15px !important; 
    padding-right: 15px !important;
  } 
}     

@media (min-width: 1200px){ 
  .col-lg-6 { 
    float: left !important;
  } 

  .col-lg-6 { 
    width: 50% !important;
  } 
}     

@media screen, projection{ 

  input[type="checkbox"] { 
    box-sizing: border-box !important; 
    padding: 0 !important;
  } 

  input[type="checkbox"] { 
    margin: 4px 0 0 !important; 
    margin-top: 1px !important; 
    line-height: normal !important;
  } 
}     


/* These were inline style tags. Uses id+class to override almost everything */
#navbar-collapse-main.style-kj7N1 {  
   height: 1px !important;  
}  

                `}
            </style>
        </div>
    );
};

export default LoginContainer;
