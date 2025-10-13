import React, { useEffect } from "react";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import useOnclickOutside from "react-cool-onclickoutside";
import "./Autocomplete.scss";

const Autocomplete = ({ isLoaded, onSelect }) => {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        init,
        clearSuggestions,
    } = usePlacesAutocomplete({
        initOnMount: false,
        debounce: 300,
    });
    const ref = useOnclickOutside(() => {
        // When the user clicks outside of the component, we can dismiss
        // the searched suggestions by calling this method
        clearSuggestions();
    });

    const handleInput = (e) => {
        // Update the keyword of the input element
        setValue(e.target.value);
    };

    const handleSelect =
        ({ description }) =>
        () => {
            // When the user selects a place, we can replace the keyword without request data from API
            // by setting the second parameter to "false"
            setValue(description, false);
            clearSuggestions();
            console.log(description);

            // Get latitude and longitude via utility functions
            getGeocode({ address: description }).then((results) => {
                console.log("Geocoding results: ", results);
                const { lat, lng } = getLatLng(results[0]);
                console.log("📍 Coordinates: ", { lat, lng });
                onSelect({ lat, lng });
            });
        };

    const renderSuggestions = () =>
        data.map((suggestion) => {
            const {
                place_id,
                structured_formatting: { main_text, secondary_text },
            } = suggestion;

            return (
                <li
                    className="list-item"
                    key={place_id}
                    onClick={handleSelect(suggestion)}
                >
                    <strong>{main_text}</strong> <small>{secondary_text}</small>
                </li>
            );
        });

    useEffect(() => {
        if (isLoaded) {
            init();
        }
    }, [isLoaded, init]);

    return (
        <div className="map-input-container" ref={ref}>
            <input
                type="text"
                className="input"
                value={value}
                onChange={handleInput}
                disabled={!ready}
                placeholder="Where are you going?"
            />
            {status === "OK" && (
                <ul className="suggestions">{renderSuggestions()}</ul>
            )}
        </div>
    );
};

export default Autocomplete;
