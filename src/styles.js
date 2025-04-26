import styled from "styled-components/native";
import { RectButton } from "react-native-gesture-handler";

export const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #e6f2ea;
  padding: 20px;
`;

export const Header = styled.View`
  margin-bottom: 20px;
`;

export const HeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const HeaderTitle = styled.Text`
  font-size: 22px;
  font-weight: bold;
`;

export const ProfileImage = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 20px;
`;

export const CardRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
`;

export const InfoCard = styled.View`
  background-color: #fff;
  padding: 12px;
  border-radius: 10px;
  width: 48%;
  elevation: 3;
`;

export const InfoText = styled.Text`
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
`;

export const AlertCard = styled.View`
  background-color: #fff;
  padding: 12px;
  border-radius: 10px;
  margin-top: 15px;
  elevation: 3;
`;

export const AlertText = styled.Text`
  font-size: 14px;
  color: #333;
`;

export const ChartContainer = styled.View`
  margin-top: 20px;
  align-items: center;
`;

export const TempStats = styled.View`
  background-color: #ffffff;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  elevation: 2;
`;

export const StatText = styled.Text`
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
`;

export const ReportButton = styled.TouchableOpacity`
  background-color: #90ee90;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  align-items: center;
`;

export const ReportText = styled.Text`
  color: #000;
  font-size: 16px;
  font-weight: bold;
`;