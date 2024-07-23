import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import { motion } from 'framer-motion';

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const underlineRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLDivElement>(null);
    const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null);
    const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const filteredRoutes = routes.server.filter((route) => !!route.name);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    useEffect(() => {
        const updateActiveTab = () => {
            const activeTab = navRef.current?.querySelector('.text-neutral-100') as HTMLElement;
            if (activeTab) {
                const index = Array.from(navRef.current?.children || []).indexOf(activeTab);
                setActiveTabIndex(index);

                if (isInitialLoad && underlineRef.current) {
                    underlineRef.current.style.width = `${activeTab.clientWidth}px`;
                    underlineRef.current.style.transform = `translateX(${activeTab.offsetLeft}px)`;
                    setTimeout(() => setIsInitialLoad(false), 50);
                }
            }
        };

        updateActiveTab();
        const timeoutId = setTimeout(updateActiveTab, 100);

        return () => clearTimeout(timeoutId);
    }, [location.pathname, isInitialLoad]);

    const handleTabClick = (index: number) => {
        setIsTransitioning(true);
        setActiveTabIndex(index);

        const navItem = navRef.current?.children[index] as HTMLElement;
        if (navItem) {
            navItem.classList.add('temp-active');
        }

        setTimeout(() => {
            setIsTransitioning(false);
            if (navItem) {
                navItem.classList.remove('temp-active');
            }
        }, 100);
    };

    console.log('Render - Active tab:', activeTabIndex, 'Hovered tab:', hoveredTabIndex);

    return (
        <React.Fragment key={'server-router'}>
            <NavigationBar />
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <Spinner size={'large'} centered />
                )
            ) : (
                <>
                    <div className='flex flex-col flex-grow'>
                        {/* Main content area */}
                        <CSSTransition timeout={150} classNames={'fade'} appear in>
                            <div className='sticky top-0 w-full bg-black shadow z-10 border-b border-[#424d5c] overflow-hidden'>
                                <div
                                    ref={navRef}
                                    className='flex items-center text-sm mx-auto px-2 max-w-full overflow-x-auto overflow-y-hidden custom-scrollbar relative'
                                >
                                    {filteredRoutes.map((route, index) =>
                                        route.permission ? (
                                            <Can key={route.path} action={route.permission} matchAny>
                                                <NavLink
                                                    key={route.path}
                                                    to={to(route.path, true)}
                                                    exact={route.exact}
                                                    className='relative flex-shrink-0 inline-flex items-center py-3 px-4 text-neutral-300 no-underline whitespace-nowrap group'
                                                    activeClassName='text-neutral-100'
                                                    onMouseEnter={() => setHoveredTabIndex(index)}
                                                    onMouseLeave={() => setHoveredTabIndex(null)}
                                                    onClick={() => handleTabClick(index)}
                                                >
                                                    <span className='relative z-10 w-full transition-colors duration-150 group-hover:text-neutral-100'>
                                                        {route.name}
                                                    </span>
                                                    <motion.span
                                                        className='absolute inset-0 my-2 bg-neutral-500 rounded-md'
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: hoveredTabIndex === index ? 0.5 : 0 }}
                                                        transition={{ duration: 0.15 }}
                                                    ></motion.span>
                                                </NavLink>
                                            </Can>
                                        ) : (
                                            <NavLink
                                                key={route.path}
                                                to={to(route.path, true)}
                                                exact={route.exact}
                                                className='relative flex-shrink-0 inline-flex items-center py-3 px-4 text-neutral-300 no-underline whitespace-nowrap transition-all duration-150 hover:text-neutral-100 rounded-md'
                                                activeClassName='text-neutral-100'
                                                onMouseEnter={() => setHoveredTabIndex(index)}
                                                onMouseLeave={() => setHoveredTabIndex(null)}
                                                onClick={() => handleTabClick(index)}
                                            >
                                                {route.name}
                                                <motion.span
                                                    className='absolute inset-0 my-2 bg-neutral-500 rounded-md'
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: hoveredTabIndex === index ? 0.5 : 0 }}
                                                    transition={{ duration: 0.15 }}
                                                ></motion.span>
                                            </NavLink>
                                        )
                                    )}
                                    <div
                                        ref={underlineRef}
                                        className={`absolute bottom-0 left-0 h-[3px] bg-cyan-600 transition-all duration-300 ${
                                            isInitialLoad ? '' : 'hidden'
                                        }`}
                                    />
                                    {!isInitialLoad && (
                                        <motion.div
                                            className='absolute bottom-0 left-0 h-[3px] bg-cyan-600'
                                            initial={false}
                                            animate={{
                                                width:
                                                    navRef.current?.querySelector(
                                                        isTransitioning ? '.temp-active' : '.text-neutral-100'
                                                    )?.clientWidth || 0,
                                                x:
                                                    (
                                                        navRef.current?.querySelector(
                                                            isTransitioning ? '.temp-active' : '.text-neutral-100'
                                                        ) as HTMLElement
                                                    )?.offsetLeft || 0,
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    {rootAdmin && (
                                        <a
                                            href={`/admin/servers/view/${serverId}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='relative flex-shrink-0 inline-flex items-center py-3 px-4 text-neutral-300 no-underline whitespace-nowrap transition-all duration-150 hover:text-neutral-100 hover:bg-neutral-500 hover:bg-opacity-50 rounded-md active:text-neutral-100'
                                        >
                                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </CSSTransition>
                        <div className='flex flex-grow'>
                            {/* Sidebar - hidden on small screens */}
                            <div className='hidden md:block w-64 bg-black overflow-y-auto custom-scrollbar'>
                                <div className='flex flex-col p-4'>
                                    {routes.server
                                        .filter((route) => !!route.name)
                                        .map((route) =>
                                            route.permission ? (
                                                <Can key={route.path} action={route.permission} matchAny>
                                                    <NavLink
                                                        to={to(route.path, true)}
                                                        exact={route.exact}
                                                        className='py-2 px-4 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors duration-150'
                                                        activeClassName='bg-neutral-800 text-neutral-100'
                                                    >
                                                        {route.name}
                                                    </NavLink>
                                                </Can>
                                            ) : (
                                                <NavLink
                                                    key={route.path}
                                                    to={to(route.path, true)}
                                                    exact={route.exact}
                                                    className='py-2 px-4 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors duration-150'
                                                    activeClassName='bg-neutral-800 text-neutral-100'
                                                >
                                                    {route.name}
                                                </NavLink>
                                            )
                                        )}
                                    {rootAdmin && (
                                        <a
                                            href={`/admin/servers/view/${serverId}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='py-2 px-4 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors duration-150'
                                        >
                                            <FontAwesomeIcon icon={faExternalLinkAlt} className='mr-2' />
                                            Admin
                                        </a>
                                    )}
                                </div>
                            </div>
                            {/* Main content area */}
                            <div className='flex-1 min-w-0 flex flex-col flex-grow'>
                                <InstallListener />
                                <TransferListener />
                                <WebsocketHandler />
                                {inConflictState &&
                                (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                                    <ConflictStateRenderer />
                                ) : (
                                    <ErrorBoundary>
                                        <TransitionRouter>
                                            <Switch location={location}>
                                                {routes.server.map(({ path, permission, component: Component }) => (
                                                    <PermissionRoute
                                                        key={path}
                                                        permission={permission}
                                                        path={to(path)}
                                                        exact
                                                    >
                                                        <Spinner.Suspense>
                                                            <Component />
                                                        </Spinner.Suspense>
                                                    </PermissionRoute>
                                                ))}
                                                <Route path={'*'} component={NotFound} />
                                            </Switch>
                                        </TransitionRouter>
                                    </ErrorBoundary>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </React.Fragment>
    );
};
