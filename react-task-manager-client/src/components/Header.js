import React from 'react';
import { Spinner } from 'react-bootstrap';
import { useLoading } from '../contexts/LoadingContext';
import LogoutButton from './LogoutButton';

export default function Header() {
    const { isLoading } = useLoading();
    console.log('Header rendered, isLoading:', isLoading);

    return (
        <div className="p-3 text-end">
            {/*{isLoading && (*/}
            {/*    <div className="d-flex align-items-center gap-2">*/}
            {/*        <Spinner animation="border" role="status" size="sm" />*/}
            {/*        <span>Loading...</span>*/}
            {/*    </div>*/}
            {/*)}*/}
            <LogoutButton />
        </div>
    );
}
