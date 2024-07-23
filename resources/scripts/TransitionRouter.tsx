import React from 'react';
import { Route } from 'react-router';
import { SwitchTransition } from 'react-transition-group';
import Fade from '@/components/elements/Fade';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

const StyledSwitchTransition = styled(SwitchTransition)`
    ${tw`relative`};

    & section {
        ${tw`absolute w-full top-0 left-0`};
    }
`;

const TransitionRouter: React.FC = ({ children }) => {
    return (
        <Route
            render={({ location }) => (
                <StyledSwitchTransition>
                    <Fade
                        containerClassName='flex flex-col flex-grow'
                        timeout={150}
                        key={location.pathname + location.search}
                        in
                        appear
                        unmountOnExit
                    >
                        <section className='flex flex-col flex-grow'>{children}</section>
                    </Fade>
                </StyledSwitchTransition>
            )}
        />
    );
};

export default TransitionRouter;
