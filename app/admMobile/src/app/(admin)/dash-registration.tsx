import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import capsService from '../../../services/capsService';
import animalsService from '../../../services/animalsService';

type AnimalType = 'gato' | 'cachorro';
type FilterType = 'todos' | AnimalType;

type Cap = {
  id: number;
  data: string;
  quantidadeKg: number | string;
  quantidade_tampinhas?: number;
  unidade?: string;
  local?: string;
};

type Animal = {
  id: number;
  data: string;
  tipoAnimal: AnimalType;
  quantidade: number | string;
};

const COLORS = {
  blue: '#5F81B7',
  gold: '#C5A51A',
  dark: '#2D2616',
  text: '#25324B',
  muted: '#6A5F43',
  red: '#A8322A',
};

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(value?: string) {
  if (!value) return '';

  const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return value;

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isUntilToday(value: string) {
  return value.slice(0, 10) <= todayString() && isValidDate(value.slice(0, 10));
}

function getCapCount(item: Cap) {
  if (item.quantidade_tampinhas != null) {
    return Number(item.quantidade_tampinhas) || 0;
  }

  return Math.round(Number(item.quantidadeKg || 0) * 500);
}

function sortByDate<T extends { data: string }>(items: T[]) {
  return [...items].sort((a, b) => b.data.localeCompare(a.data));
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-2xl font-extrabold text-[#2D2616]">
      {children}
    </Text>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  return (
    <View className="mb-3 w-full">
      <Text className="mb-1 font-bold text-[#6A5F43]">{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor="#999999"
        className="min-h-12 rounded-xl border border-[#E8D99F] bg-white px-3 py-2 text-base text-[#25324B]"
      />
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  variant = 'gold',
}: {
  title: string;
  onPress: () => void;
  variant?: 'gold' | 'blue' | 'red' | 'light';
}) {
  const variants = {
    gold: 'bg-[#C5A51A]',
    blue: 'bg-[#5F81B7]',
    red: 'bg-[#A8322A]',
    light: 'border border-[#E8D99F] bg-[#FFFDF6]',
  };

  const textColor = variant === 'light' ? 'text-[#5A4A15]' : 'text-white';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`min-h-11 items-center justify-center rounded-xl px-4 py-3 ${variants[variant]}`}
    >
      <Text className={`text-center font-extrabold ${textColor}`}>
        {title}
      </Text>
    </Pressable>
  );
}

function TypeSelector({
  value,
  onChange,
  includeAll = false,
}: {
  value: FilterType;
  onChange: (value: FilterType) => void;
  includeAll?: boolean;
}) {
  const options: { label: string; value: FilterType }[] = [
    ...(includeAll ? [{ label: 'Todos', value: 'todos' as const }] : []),
    { label: 'Gato', value: 'gato' },
    { label: 'Cachorro', value: 'cachorro' },
  ];

  return (
    <View className="mb-3">
      <Text className="mb-2 font-bold text-[#6A5F43]">
        {includeAll ? 'Filtrar por tipo' : 'Tipo de animal'}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={`rounded-full border px-4 py-3 ${
                selected
                  ? 'border-[#5F81B7] bg-[#5F81B7]'
                  : 'border-[#E8D99F] bg-white'
              }`}
            >
              <Text
                className={`font-bold ${
                  selected ? 'text-white' : 'text-[#25324B]'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MonthFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field
      label="Mês (AAAA-MM)"
      value={value}
      onChangeText={onChange}
      placeholder="Ex.: 2026-10"
    />
  );
}

export default function DashRegistration() {
  const [caps, setCaps] = useState<Cap[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filterCapDate, setFilterCapDate] = useState('');
  const [filterAnimalDate, setFilterAnimalDate] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todos');

  const [capCreateForm, setCapCreateForm] = useState({
    data: todayString(),
    quantidadeKg: '',
    unidade: '',
    local: '',
  });

  const [animalCreateForm, setAnimalCreateForm] = useState({
    data: todayString(),
    tipoAnimal: 'gato' as AnimalType,
    quantidade: '',
  });

  const [editingCapId, setEditingCapId] = useState<number | null>(null);
  const [editingAnimalId, setEditingAnimalId] = useState<number | null>(null);

  const [capForm, setCapForm] = useState({
    data: '',
    quantidadeKg: '',
    unidade: '',
    local: '',
  });

  const [animalForm, setAnimalForm] = useState({
    data: '',
    tipoAnimal: 'gato' as AnimalType,
    quantidade: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [capsResult, animalsResult] = await Promise.allSettled([
        capsService.getAll(),
        animalsService.getAll(),
      ]);

      const errors: unknown[] = [];

      if (capsResult.status === 'fulfilled') {
        setCaps(Array.isArray(capsResult.value) ? capsResult.value : []);
      } else {
        errors.push(capsResult.reason);
      }

      if (animalsResult.status === 'fulfilled') {
        setAnimals(
          Array.isArray(animalsResult.value) ? animalsResult.value : [],
        );
      } else {
        errors.push(animalsResult.reason);
      }

      if (errors.length > 0) {
        errors.forEach((error) =>
          console.error('Erro ao carregar registros:', error),
        );

        if (errors.length === 2) {
          Alert.alert('Erro', 'Não foi possível carregar os registros.');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      Alert.alert('Erro', 'Não foi possível carregar os registros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const filteredCaps = useMemo(
    () =>
      sortByDate(
        caps.filter(
          (item) =>
            !filterCapDate ||
            (isValidDate(item.data.slice(0, 10)) &&
              item.data.slice(0, 7) === filterCapDate),
        ),
      ),
    [caps, filterCapDate],
  );

  const filteredAnimals = useMemo(
    () =>
      sortByDate(
        animals.filter((item) => {
          const byDate =
            !filterAnimalDate ||
            (isValidDate(item.data.slice(0, 10)) &&
              item.data.slice(0, 7) === filterAnimalDate);

          const byType =
            filterType === 'todos' || item.tipoAnimal === filterType;

          return byDate && byType;
        }),
      ),
    [animals, filterAnimalDate, filterType],
  );

  const summary = useMemo(() => {
    const totalCaps = caps
      .filter((item) => isUntilToday(item.data))
      .reduce((total, item) => total + getCapCount(item), 0);

    const totalCats = animals
      .filter(
        (item) =>
          isUntilToday(item.data) && item.tipoAnimal === 'gato',
      )
      .reduce((total, item) => total + Number(item.quantidade || 0), 0);

    const totalDogs = animals
      .filter(
        (item) =>
          isUntilToday(item.data) && item.tipoAnimal === 'cachorro',
      )
      .reduce((total, item) => total + Number(item.quantidade || 0), 0);

    return { totalCaps, totalCats, totalDogs };
  }, [caps, animals]);

  async function createCap() {
    if (
      !isValidDate(capCreateForm.data) ||
      capCreateForm.quantidadeKg.trim() === '' ||
      !Number.isFinite(Number(capCreateForm.quantidadeKg)) ||
      Number(capCreateForm.quantidadeKg) <= 0
    ) {
      Alert.alert(
        'Dados inválidos',
        'Informe uma data válida e uma quantidade de quilos maior que zero.',
      );
      return;
    }

    try {
      setSaving(true);

      await capsService.create({
        data: capCreateForm.data,
        quantidadeKg: Number(capCreateForm.quantidadeKg),
        unidade: capCreateForm.unidade.trim(),
        local: capCreateForm.local.trim(),
      });

      setCapCreateForm({
        data: todayString(),
        quantidadeKg: '',
        unidade: '',
        local: '',
      });
      await loadData();

      Alert.alert('Sucesso', 'Registro de tampinhas cadastrado.');
    } catch (error) {
      console.error('Erro ao cadastrar tampinhas:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar as tampinhas.');
    } finally {
      setSaving(false);
    }
  }

  async function createAnimal() {
    const quantity = Number(animalCreateForm.quantidade);

    if (
      !isValidDate(animalCreateForm.data) ||
      animalCreateForm.quantidade.trim() === '' ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      Alert.alert(
        'Dados inválidos',
        'Informe uma data válida e uma quantidade inteira maior que zero.',
      );
      return;
    }

    try {
      setSaving(true);

      await animalsService.create({
        data: animalCreateForm.data,
        tipoAnimal: animalCreateForm.tipoAnimal,
        quantidade: quantity,
      });

      setAnimalCreateForm({
        data: todayString(),
        tipoAnimal: 'gato',
        quantidade: '',
      });

      await loadData();
      Alert.alert('Sucesso', 'Registro de animais cadastrado.');
    } catch (error) {
      console.error('Erro ao cadastrar animais:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar os animais.');
    } finally {
      setSaving(false);
    }
  }

  function startEditCap(item: Cap) {
    setEditingCapId(item.id);
    setCapForm({
      data: item.data.slice(0, 10),
      quantidadeKg: String(item.quantidadeKg ?? ''),
      unidade: item.unidade ?? '',
      local: item.local ?? '',
    });
  }

  async function updateCap() {
    if (
      editingCapId === null ||
      !isValidDate(capForm.data) ||
      capForm.quantidadeKg.trim() === '' ||
      !Number.isFinite(Number(capForm.quantidadeKg)) ||
      Number(capForm.quantidadeKg) <= 0
    ) {
      Alert.alert('Dados inválidos', 'Confira a data e a quantidade em kg.');
      return;
    }

    try {
      setSaving(true);

      await capsService.update(String(editingCapId), {
        data: capForm.data,
        quantidadeKg: Number(capForm.quantidadeKg),
        unidade: capForm.unidade.trim(),
        local: capForm.local.trim(),
      });

      setEditingCapId(null);
      await loadData();
      Alert.alert('Sucesso', 'Registro de tampinhas atualizado.');
    } catch (error) {
      console.error('Erro ao atualizar tampinhas:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o registro.');
    } finally {
      setSaving(false);
    }
  }

  function startEditAnimal(item: Animal) {
    setEditingAnimalId(item.id);
    setAnimalForm({
      data: item.data.slice(0, 10),
      tipoAnimal: item.tipoAnimal,
      quantidade: String(item.quantidade ?? ''),
    });
  }

  async function updateAnimal() {
    const quantity = Number(animalForm.quantidade);

    if (
      editingAnimalId === null ||
      !isValidDate(animalForm.data) ||
      animalForm.quantidade.trim() === '' ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      Alert.alert(
        'Dados inválidos',
        'Confira a data e informe uma quantidade inteira maior que zero.',
      );
      return;
    }

    try {
      setSaving(true);

      await animalsService.update(String(editingAnimalId), {
        data: animalForm.data,
        tipoAnimal: animalForm.tipoAnimal,
        quantidade: quantity,
      });

      setEditingAnimalId(null);
      await loadData();
      Alert.alert('Sucesso', 'Registro de animais atualizado.');
    } catch (error) {
      console.error('Erro ao atualizar animais:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o registro.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteCap(id: number) {
    Alert.alert(
      'Excluir registro',
      'Deseja realmente excluir este registro de tampinhas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await capsService.remove(String(id));
              await loadData();
            } catch (error) {
              console.error('Erro ao excluir tampinhas:', error);
              Alert.alert('Erro', 'Não foi possível excluir o registro.');
            }
          },
        },
      ],
    );
  }

  function confirmDeleteAnimal(id: number) {
    Alert.alert(
      'Excluir registro',
      'Deseja realmente excluir este registro de animais?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await animalsService.remove(String(id));
              await loadData();
            } catch (error) {
              console.error('Erro ao excluir animais:', error);
              Alert.alert('Erro', 'Não foi possível excluir o registro.');
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F4F8FF]">
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text className="mt-3 text-base text-[#25324B]">
          Carregando registros...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F4F8FF]"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="rounded-3xl border border-[#E8D99F] bg-white p-4">
        <Text className="mb-5 text-center text-3xl font-extrabold text-[#2D2616]">
          Registros
        </Text>

        {/* RESUMO */}
        <View className="mb-6 rounded-2xl border border-[#E4EAF3] bg-white p-3">
          <Text className="mb-4 text-center text-2xl font-extrabold text-[#2D2616]">
            Quantidades
          </Text>

          <View className="gap-3">
            {[
              {
                title: 'Tampinhas arrecadadas',
                value: summary.totalCaps,
                subtitle: 'unidades',
              },
              {
                title: 'Gatos',
                value: summary.totalCats,
                subtitle: 'castrados',
              },
              {
                title: 'Cachorros',
                value: summary.totalDogs,
                subtitle: 'castrados',
              },
            ].map((item) => (
              <View
                key={item.title}
                className="min-h-28 items-center justify-center rounded-2xl border border-[#E4EAF3] bg-[#F4F8FF] p-4"
              >
                <Text className="text-center text-lg font-extrabold text-[#6A5F43]">
                  {item.title}
                </Text>

                <Text className="my-1 text-4xl font-extrabold text-[#2D2616]">
                  {item.value.toLocaleString('pt-BR')}
                </Text>

                <Text className="text-xs font-extrabold uppercase text-[#8B6D0A]">
                  {item.subtitle}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* TAMPINHAS */}
        <View className="mb-6 gap-4 rounded-3xl border border-[#E4EAF3] bg-white p-4">
          <Text className="self-start rounded-full bg-[#F8F1D9] px-4 py-2 font-extrabold uppercase text-[#8B6D0A]">
            Arrecadação
          </Text>

          <SectionTitle>Registros de tampinhas</SectionTitle>

          <View className="rounded-2xl border border-[#E4EAF3] bg-[#F4F8FF] p-4">
            <Text className="mb-4 text-lg font-bold text-[#4E4216]">
              Novo registro
            </Text>

            <Field
              label="Data (AAAA-MM-DD)"
              value={capCreateForm.data}
              onChangeText={(data) =>
                setCapCreateForm((old) => ({ ...old, data }))
              }
              placeholder="2026-10-20"
            />

            <Field
              label="Quantidade em kg"
              value={capCreateForm.quantidadeKg}
              onChangeText={(quantidadeKg) =>
                setCapCreateForm((old) => ({ ...old, quantidadeKg }))
              }
              placeholder="Ex.: 5.5"
              keyboardType="decimal-pad"
            />

            <Field
              label="Local"
              value={capCreateForm.local}
              onChangeText={(local) =>
                setCapCreateForm((old) => ({ ...old, local }))
              }
              placeholder="Ponto de coleta / local da doação"
            />

            <ActionButton
              title={saving ? 'Salvando...' : 'Salvar tampinhas'}
              onPress={createCap}
            />
          </View>

          <View className="rounded-2xl border border-[#E8D99F] bg-[#FFFDF6] p-4">
            <MonthFilter
              value={filterCapDate}
              onChange={setFilterCapDate}
            />

            <ActionButton
              title="Limpar filtro"
              variant="light"
              onPress={() => setFilterCapDate('')}
            />
          </View>

          <Text className="text-lg font-extrabold text-[#4E4216]">
            Registros cadastrados ({filteredCaps.length})
          </Text>

          {filteredCaps.length === 0 ? (
            <Text className="rounded-xl bg-[#F4F8FF] p-4 text-center text-[#666666]">
              Nenhum registro de tampinhas encontrado.
            </Text>
          ) : (
            filteredCaps.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-[#E4EAF3] bg-white p-4"
              >
                {editingCapId === item.id ? (
                  <>
                    <Text className="mb-3 text-lg font-extrabold text-[#4E4216]">
                      Editar tampinhas
                    </Text>

                    <Field
                      label="Data (AAAA-MM-DD)"
                      value={capForm.data}
                      onChangeText={(data) =>
                        setCapForm((old) => ({ ...old, data }))
                      }
                      placeholder="2026-10-20"
                    />

                    <Field
                      label="Quantidade em kg"
                      value={capForm.quantidadeKg}
                      onChangeText={(quantidadeKg) =>
                        setCapForm((old) => ({ ...old, quantidadeKg }))
                      }
                      placeholder="Quantidade em kg"
                      keyboardType="decimal-pad"
                    />

                    <Field
                      label="Local"
                      value={capForm.local}
                      onChangeText={(local) =>
                        setCapForm((old) => ({ ...old, local }))
                      }
                      placeholder="Ponto de coleta / local da doação"
                    />

                    <Text className="mb-3 rounded-xl bg-[#FFFDF6] p-3 text-[#6A5F43]">
                      Estimativa: {Math.round(Number(capForm.quantidadeKg || 0) * 500).toLocaleString('pt-BR')} tampinhas
                    </Text>

                    <View className="gap-2">
                      <ActionButton
                        title={saving ? 'Salvando...' : 'Salvar alterações'}
                        onPress={updateCap}
                      />

                      <ActionButton
                        title="Cancelar"
                        variant="light"
                        onPress={() => setEditingCapId(null)}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Text className="mb-2 text-lg font-extrabold text-[#25324B]">
                      {formatDate(item.data)}
                    </Text>

                    <Text className="mb-1 text-base text-[#2F2818]">
                      Peso: {Number(item.quantidadeKg || 0).toLocaleString('pt-BR')} kg
                    </Text>

                    <Text className="mb-1 text-base text-[#2F2818]">
                      Unidade: {item.unidade || 'Não informada'}
                    </Text>

                    <Text className="mb-1 text-base text-[#2F2818]">
                      Local: {item.local || 'Não informado'}
                    </Text>

                    <Text className="mb-4 text-base text-[#6A5F43]">
                      Estimativa: {getCapCount(item).toLocaleString('pt-BR')} tampinhas
                    </Text>

                    <View className="gap-2">
                      <ActionButton
                        title="Editar"
                        variant="light"
                        onPress={() => startEditCap(item)}
                      />

                      <ActionButton
                        title="Excluir"
                        variant="red"
                        onPress={() => confirmDeleteCap(item.id)}
                      />
                    </View>
                  </>
                )}
              </View>
            ))
          )}
        </View>

        {/* ANIMAIS */}
        <View className="gap-4 rounded-3xl border border-[#E4EAF3] bg-white p-4">
          <Text className="self-start rounded-full bg-[#F8F1D9] px-4 py-2 font-extrabold uppercase text-[#8B6D0A]">
            Castrações
          </Text>

          <SectionTitle>Registros de animais</SectionTitle>

          <View className="rounded-2xl border border-[#E4EAF3] bg-[#F4F8FF] p-4">
            <Text className="mb-4 text-lg font-bold text-[#4E4216]">
              Novo registro
            </Text>

            <Field
              label="Data (AAAA-MM-DD)"
              value={animalCreateForm.data}
              onChangeText={(data) =>
                setAnimalCreateForm((old) => ({ ...old, data }))
              }
              placeholder="2026-10-20"
            />

            <TypeSelector
              value={animalCreateForm.tipoAnimal}
              onChange={(tipoAnimal) =>
                setAnimalCreateForm((old) => ({
                  ...old,
                  tipoAnimal: tipoAnimal as AnimalType,
                }))
              }
            />

            <Field
              label="Quantidade de animais"
              value={animalCreateForm.quantidade}
              onChangeText={(quantidade) =>
                setAnimalCreateForm((old) => ({ ...old, quantidade }))
              }
              placeholder="Ex.: 10"
              keyboardType="numeric"
            />

            <ActionButton
              title={saving ? 'Salvando...' : 'Salvar animais'}
              onPress={createAnimal}
            />
          </View>

          <View className="rounded-2xl border border-[#E8D99F] bg-[#FFFDF6] p-4">
            <MonthFilter
              value={filterAnimalDate}
              onChange={setFilterAnimalDate}
            />

            <TypeSelector
              value={filterType}
              onChange={setFilterType}
              includeAll
            />

            <ActionButton
              title="Limpar filtros"
              variant="light"
              onPress={() => {
                setFilterAnimalDate('');
                setFilterType('todos');
              }}
            />
          </View>

          <Text className="text-lg font-extrabold text-[#4E4216]">
            Registros cadastrados ({filteredAnimals.length})
          </Text>

          {filteredAnimals.length === 0 ? (
            <Text className="rounded-xl bg-[#F4F8FF] p-4 text-center text-[#666666]">
              Nenhum registro de animais encontrado.
            </Text>
          ) : (
            filteredAnimals.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-[#E4EAF3] bg-white p-4"
              >
                {editingAnimalId === item.id ? (
                  <>
                    <Text className="mb-3 text-lg font-extrabold text-[#4E4216]">
                      Editar animal
                    </Text>

                    <Field
                      label="Data (AAAA-MM-DD)"
                      value={animalForm.data}
                      onChangeText={(data) =>
                        setAnimalForm((old) => ({ ...old, data }))
                      }
                      placeholder="2026-10-20"
                    />

                    <TypeSelector
                      value={animalForm.tipoAnimal}
                      onChange={(tipoAnimal) =>
                        setAnimalForm((old) => ({
                          ...old,
                          tipoAnimal: tipoAnimal as AnimalType,
                        }))
                      }
                    />

                    <Field
                      label="Quantidade"
                      value={animalForm.quantidade}
                      onChangeText={(quantidade) =>
                        setAnimalForm((old) => ({ ...old, quantidade }))
                      }
                      placeholder="Quantidade"
                      keyboardType="numeric"
                    />

                    <View className="gap-2">
                      <ActionButton
                        title={saving ? 'Salvando...' : 'Salvar alterações'}
                        onPress={updateAnimal}
                      />

                      <ActionButton
                        title="Cancelar"
                        variant="light"
                        onPress={() => setEditingAnimalId(null)}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Text className="mb-2 text-lg font-extrabold capitalize text-[#25324B]">
                      {item.tipoAnimal === 'gato' ? 'Gato' : 'Cachorro'}
                    </Text>

                    <Text className="mb-1 text-base text-[#2F2818]">
                      Data: {formatDate(item.data)}
                    </Text>

                    <Text className="mb-4 text-base text-[#6A5F43]">
                      Quantidade: {Number(item.quantidade || 0).toLocaleString('pt-BR')}
                    </Text>

                    <View className="gap-2">
                      <ActionButton
                        title="Editar"
                        variant="light"
                        onPress={() => startEditAnimal(item)}
                      />

                      <ActionButton
                        title="Excluir"
                        variant="red"
                        onPress={() => confirmDeleteAnimal(item.id)}
                      />
                    </View>
                  </>
                )}
              </View>
            ))
          )}
        </View>

        <Pressable
          onPress={loadData}
          className="mt-5 items-center rounded-xl bg-[#5F81B7] p-4"
        >
          <Text className="font-extrabold text-white">
            Atualizar registros
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}