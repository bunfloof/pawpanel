import * as React from 'react';
import { useState, forwardRef } from 'react';
import { ServerContext } from '@/state/server';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faLayerGroup, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw, { theme } from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';

const RightNavigation = styled.div`
    & > a,
    & > button,
    & > .navigation-link {
        ${tw`flex items-center h-full no-underline text-neutral-300 px-6 cursor-pointer transition-all duration-150`};

        &:active,
        &:hover {
            ${tw`text-neutral-100 bg-black`};
        }

        &:active,
        &:hover,
        &.active {
            box-shadow: inset 0 -2px ${theme`colors.cyan.600`.toString()};
        }
    }
`;

const NavigationBar = forwardRef<HTMLDivElement>((_, ref) => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const { serverName, serverId } = (() => {
        try {
            const serverData = ServerContext.useStoreState((state) => state.server.data);
            return {
                serverName: serverData?.name ?? name,
                serverId: serverData?.id,
            };
        } catch {
            return { serverName: name, serverId: undefined };
        }
    })();
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <div ref={ref} className={'w-full bg-neutral-900 shadow-md overflow-x-auto z-10'}>
            <SpinnerOverlay visible={isLoggingOut} />
            <div className={'mx-auto w-full flex items-center h-[3.5rem] px-[24px]'}>
                <NavLink
                    to={'/'}
                    exact
                    className='px-3 text-neutral-300 hover:text-neutral-100 transition-colors duration-150'
                >
                    <span className='flex items-center whitespace-nowrap'>
                        {' '}
                        <FontAwesomeIcon icon={faLayerGroup} /> <span className='ml-2'>Servers</span>
                    </span>
                </NavLink>
                <ol>
                    <li className='text-neutral-400'>/</li>
                </ol>
                <div id={'logo'} className={'flex-1 min-w-0'}>
                    <Link
                        to={serverId ? `/server/${serverId}` : '/'}
                        className={
                            'pl-3 no-underline text-neutral-300 hover:text-neutral-100 transition-colors duration-150 block truncate'
                        }
                        title={serverName}
                    >
                        {serverName}
                    </Link>
                </div>
                <RightNavigation className={'flex h-full items-center justify-center'}>
                    <SearchContainer />
                    <Tooltip placement={'bottom'} content={'Dashboard'}>
                        <NavLink to={'/'} exact>
                            <FontAwesomeIcon icon={faLayerGroup} />
                        </NavLink>
                    </Tooltip>
                    {rootAdmin && (
                        <Tooltip placement={'bottom'} content={'Admin'}>
                            <a href={'/admin'} rel={'noreferrer'}>
                                <FontAwesomeIcon icon={faCogs} />
                            </a>
                        </Tooltip>
                    )}
                    <Tooltip placement={'bottom'} content={'Account Settings'}>
                        <NavLink to={'/account'}>
                            <span className={'flex items-center w-5 h-5'}>
                                <Avatar.User />
                            </span>
                        </NavLink>
                    </Tooltip>
                    <Tooltip placement={'bottom'} content={'Sign Out'}>
                        <button onClick={onTriggerLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </Tooltip>
                </RightNavigation>
            </div>
        </div>
    );
});

export default NavigationBar;
