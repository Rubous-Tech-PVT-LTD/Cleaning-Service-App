import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Theme } from '../theme';

interface SlotSelectorProps {
  onSlotSelect: (date: Date, time: string) => void;
}

export const SlotSelector = ({ onSlotSelect }: SlotSelectorProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00 AM');

  // Generate next 10 days
  const dates = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const timeSlots = [
    { label: 'Morning', slots: ['09:00 AM', '10:00 AM', '11:00 AM'] },
    { label: 'Afternoon', slots: ['12:00 PM', '02:00 PM', '04:00 PM'] },
    { label: 'Evening', slots: ['06:00 PM', '07:00 PM', '08:00 PM'] },
  ];

  const handleSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    onSlotSelect(date, time);
  };

  return (
    <View style={{ marginVertical: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.textPrimary, marginBottom: 16 }}>Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
        {dates.map((date, i) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleSelect(date, selectedTime)}
              style={{
                width: 70,
                height: 90,
                borderRadius: 20,
                backgroundColor: isSelected ? Theme.primary : 'white',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                borderWidth: 1.5,
                borderColor: isSelected ? Theme.primary : '#F1F5F9',
                shadowColor: isSelected ? Theme.primary : '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isSelected ? 0.3 : 0.05,
                shadowRadius: 8,
                elevation: isSelected ? 8 : 2,
              }}
            >
              <Text style={{ fontSize: 12, color: isSelected ? 'rgba(255,255,255,0.8)' : Theme.textSecondary, fontWeight: '700' }}>
                {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </Text>
              <Text style={{ fontSize: 22, color: isSelected ? 'white' : Theme.textPrimary, fontWeight: '900', marginTop: 4 }}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.textPrimary, marginTop: 24, marginBottom: 16 }}>Select Time Slot</Text>
      {timeSlots.map((section, idx) => (
        <View key={idx} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textSecondary, marginBottom: 12 }}>{section.label}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {section.slots.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => handleSelect(selectedDate, slot)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: isSelected ? Theme.primary : '#F8FAFC',
                    marginRight: 10,
                    marginBottom: 10,
                    borderWidth: 1.5,
                    borderColor: isSelected ? Theme.primary : '#F1F5F9',
                  }}
                >
                  <Text style={{ color: isSelected ? 'white' : Theme.textPrimary, fontWeight: 'bold', fontSize: 14 }}>{slot}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};
