import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { faExternalLinkAlt, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
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
    //const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
    //const [isTransitioning, setIsTransitioning] = useState(false);
    const filteredRoutes = routes.server.filter((route) => !!route.name);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [activeRoute, setActiveRoute] = useState(location.pathname);

    const [sidebarHoveredItem, setSidebarHoveredItem] = useState<string | null>(null);

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
        setActiveRoute(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        const updateActiveTab = () => {
            const activeTab = navRef.current?.querySelector('.text-neutral-100') as HTMLElement;
            if (activeTab) {
                //const index = Array.from(navRef.current?.children || []).indexOf(activeTab);
                //setActiveTabIndex(index);

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

    //console.log('Render - Active tab:', activeTabIndex, 'Hovered tab:', hoveredTabIndex);

    const navBar1Ref = useRef<HTMLDivElement>(null);
    const navBar2Ref = useRef<HTMLDivElement>(null);
    const [navHeight, setNavHeight] = useState(0);
    const [isNav2Entered, setIsNav2Entered] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    const calculateNavHeight = useCallback(() => {
        const height1 = navBar1Ref.current?.offsetHeight ?? 0;
        const height2 = navBar2Ref.current?.offsetHeight ?? 0;
        const totalHeight = height1 + height2;

        // adjust height based on scroll position, but don't go below height2
        const adjustedHeight = Math.max(height2, totalHeight - scrollY);

        //console.log('Nav1 height:', height1, 'Nav2 height:', height2, 'Adjusted height:', adjustedHeight);
        setNavHeight(adjustedHeight);
    }, [scrollY]);

    useEffect(() => {
        if (isNav2Entered) {
            calculateNavHeight();
        }
    }, [isNav2Entered, calculateNavHeight]);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', calculateNavHeight);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', calculateNavHeight);
        };
    }, [calculateNavHeight]);

    const handleNav2Entered = () => {
        setIsNav2Entered(true);
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
        if (window.innerWidth >= 768) {
            const saved = localStorage.getItem('sidebarOpen');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return false;
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                const saved = localStorage.getItem('sidebarOpen');
                setIsSidebarOpen(saved !== null ? JSON.parse(saved) : true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (window.innerWidth >= 768) {
            localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
        }
    }, [isSidebarOpen]);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev: boolean) => {
            const newState = !prev;
            if (window.innerWidth >= 768) {
                localStorage.setItem('sidebarOpen', JSON.stringify(newState));
            }
            return newState;
        });
    };

    const handleSidebarItemClick = () => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <React.Fragment key={'server-router'}>
            <NavigationBar ref={navBar1Ref} />
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <Spinner size={'large'} centered />
                )
            ) : (
                <>
                    <div className='flex flex-col flex-grow'>
                        <CSSTransition timeout={150} classNames={'fade'} appear in onEntered={handleNav2Entered}>
                            {/* Subnavigation bar area */}
                            <div
                                ref={navBar2Ref}
                                className='sticky top-0 w-full bg-black shadow z-10 border-b border-[#424d5c] overflow-hidden'
                            >
                                <div
                                    ref={navRef}
                                    className='flex items-center text-sm mx-auto px-2 max-w-full overflow-x-auto overflow-y-hidden custom-scrollbar relative'
                                >
                                    <button
                                        onClick={toggleSidebar}
                                        className='mr-2 p-2 text-neutral-300 hover:text-neutral-100 focus:outline-none'
                                    >
                                        <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} />
                                    </button>
                                    {filteredRoutes.map((route, index) =>
                                        route.permission ? (
                                            <Can key={route.path} action={route.permission} matchAny>
                                                <NavLink
                                                    key={route.path}
                                                    to={to(route.path, true)}
                                                    exact={route.exact}
                                                    className={`relative flex-shrink-0 inline-flex items-center py-3 px-4 text-neutral-300 no-underline whitespace-nowrap group ${
                                                        location.pathname === to(route.path, true)
                                                            ? 'cursor-default pointer-events-none'
                                                            : ''
                                                    }`}
                                                    activeClassName='text-neutral-100'
                                                    onMouseEnter={() => setHoveredTabIndex(index)}
                                                    onMouseLeave={() => setHoveredTabIndex(null)}
                                                >
                                                    <span className='relative z-10 w-full transition-colors duration-150 group-hover:text-neutral-100'>
                                                        {route.name}
                                                    </span>
                                                    <motion.span
                                                        className='absolute inset-0 my-2 bg-neutral-500 rounded-md'
                                                        initial={{ opacity: 0 }}
                                                        animate={{
                                                            opacity:
                                                                hoveredTabIndex === index ||
                                                                sidebarHoveredItem === route.path
                                                                    ? 0.5
                                                                    : 0,
                                                        }}
                                                        transition={{ duration: 0.15 }}
                                                    ></motion.span>
                                                </NavLink>
                                            </Can>
                                        ) : (
                                            <NavLink
                                                key={route.path}
                                                to={to(route.path, true)}
                                                exact={route.exact}
                                                className={`relative flex-shrink-0 inline-flex items-center py-3 px-4 text-neutral-300 no-underline whitespace-nowrap group ${
                                                    location.pathname === to(route.path, true)
                                                        ? 'cursor-default pointer-events-none'
                                                        : ''
                                                }`}
                                                activeClassName='text-neutral-100'
                                                onMouseEnter={() => setHoveredTabIndex(index)}
                                                onMouseLeave={() => setHoveredTabIndex(null)}
                                            >
                                                <span className='relative z-10 w-full transition-colors duration-150 group-hover:text-neutral-100'>
                                                    {route.name}
                                                </span>
                                                <motion.span
                                                    className='absolute inset-0 my-2 bg-neutral-500 rounded-md'
                                                    initial={{ opacity: 0 }}
                                                    animate={{
                                                        opacity:
                                                            hoveredTabIndex === index ||
                                                            sidebarHoveredItem === route.path
                                                                ? 0.5
                                                                : 0,
                                                    }}
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
                                                    navRef.current?.querySelector(`a[href="${activeRoute}"]`)
                                                        ?.clientWidth || 0,
                                                x:
                                                    (
                                                        navRef.current?.querySelector(
                                                            `a[href="${activeRoute}"]`
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
                            {/* Sidebar */}
                            <div
                                className={`w-64 bg-black overflow-y-auto text-sm custom-scrollbar transition-all duration-300 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        fixed md:relative md:flex-shrink-0 z-50`}
                                style={{
                                    position: isSidebarOpen ? 'sticky' : 'fixed',
                                    top: `${navHeight}px`,
                                    height: `calc(100vh - ${navHeight}px)`,
                                    overflowY: 'auto',
                                    transition: 'transform 0.3s ease-in-out, top 0.2s, height 0.2s',
                                }}
                            >
                                {/* Sidebar content */}
                                <div className='flex flex-col p-4'>
                                    {routes.server
                                        .filter((route) => !!route.name)
                                        .map((route) =>
                                            route.permission ? (
                                                <Can key={route.path} action={route.permission} matchAny>
                                                    <NavLink
                                                        key={route.path}
                                                        to={to(route.path, true)}
                                                        exact={route.exact}
                                                        className={`py-2 px-4 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors duration-150 ${
                                                            location.pathname === to(route.path, true)
                                                                ? 'cursor-default pointer-events-none'
                                                                : ''
                                                        }`}
                                                        activeClassName='bg-neutral-800 text-neutral-100'
                                                        onMouseEnter={() => setSidebarHoveredItem(route.path)}
                                                        onMouseLeave={() => setSidebarHoveredItem(null)}
                                                        onClick={handleSidebarItemClick}
                                                    >
                                                        {route.name}
                                                    </NavLink>
                                                </Can>
                                            ) : (
                                                <NavLink
                                                    key={route.path}
                                                    to={to(route.path, true)}
                                                    exact={route.exact}
                                                    className={`py-2 px-4 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors duration-150 ${
                                                        location.pathname === to(route.path, true)
                                                            ? 'cursor-default pointer-events-none'
                                                            : ''
                                                    }`}
                                                    activeClassName='bg-neutral-800 text-neutral-100'
                                                    onMouseEnter={() => setSidebarHoveredItem(route.path)}
                                                    onMouseLeave={() => setSidebarHoveredItem(null)}
                                                    onClick={handleSidebarItemClick}
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
                    {isSidebarOpen && (
                        <div
                            className='fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden'
                            onClick={() => setIsSidebarOpen(false)}
                            style={{
                                top: `${navHeight}px`,
                                height: `calc(100vh - ${navHeight}px)`,
                            }}
                        ></div>
                    )}
                </>
            )}
        </React.Fragment>
    );
};
