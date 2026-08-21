// In file: /types/google-places.d.ts

declare module 'react-native-google-places-autocomplete' {
  import React from 'react';
  import { StyleProp, TextInputProps, ViewStyle, TextStyle, ImageStyle } from 'react-native';

  // Define the shape of the data and details objects
  export interface GooglePlaceData {
    description: string;
    place_id: string;
    reference: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    terms: {
      offset: number;
      value: string;
    }[];
    types: string[];
  }

  export interface GooglePlaceDetail {
    address_components: any[];
    adr_address: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      viewport: {
        northeast: {
          lat: number;
          lng: number;
        };
        southwest: {
          lat: number;
          lng: number;
        };
      };
    };
    icon: string;
    id: string;
    name: string;
    place_id: string;
    reference: string;
    scope: string;
    types: string[];
    url: string;
    utc_offset: number;
    vicinity: string;
  }

  // Define the props for the component
  export interface GooglePlacesAutocompleteProps extends TextInputProps {
    query: {
      key: string;
      language?: string;
      components?: string;
      [key: string]: any;
    };
    onPress: (data: GooglePlaceData, detail: GooglePlaceDetail | null) => void;
    placeholder?: string;
    fetchDetails?: boolean;
    predefinedPlaces?: GooglePlaceData[];
    styles?: {
      container?: StyleProp<ViewStyle>;
      textInputContainer?: StyleProp<ViewStyle>;
      textInput?: StyleProp<TextStyle>;
      listView?: StyleProp<ViewStyle>;
      row?: StyleProp<ViewStyle>;
      description?: StyleProp<TextStyle>;
      predefinedPlacesDescription?: StyleProp<TextStyle>;
      separator?: StyleProp<ViewStyle>;
      loader?: StyleProp<ViewStyle>;
      poweredContainer?: StyleProp<ViewStyle>;
      powered?: StyleProp<ImageStyle>;
    };
    [key: string]: any;
  }

  export class GooglePlacesAutocomplete extends React.Component<GooglePlacesAutocompleteProps> {}
}
