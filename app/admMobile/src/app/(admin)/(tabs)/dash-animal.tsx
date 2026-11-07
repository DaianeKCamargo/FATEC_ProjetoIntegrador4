
import React, { useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import animalsService, { Animal } from '../../../services/animalService';

type AnimalType = 'gato' | 'cachorro';
interface AnimalForm {
  data: string;
  tipoAnimal: AnimalType;
  quantidade: string;
}

const initialForm: AnimalForm = {
  data: '',
  tipoAnimal: 'gato',
  quantidade: '',
};

function formatLocalDate(value: string) {
  if (!value) return '';

  const [year, month, day] = value.slice(0, 10).split('-');

  return `${day}/${month}/${year}`;
}

function getDateValue(value: string) {
  return value ? value.slice(0, 10) : '';
}

export default function DashAnimal() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cadastro
  const [form, setForm] = useState<AnimalForm>(initialForm);

  // Filtros
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState<
    'todos' | AnimalType
  >('todos');

  // Edição
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AnimalForm>(initialForm);

  // Carregar registros
  async function loadData() {
    try {
      setLoading(true);

      const dados = await animalsService.getAll();

      setAnimals(dados);
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os registros.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Atualizar formulário
  function updateForm(
    field: keyof AnimalForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateEditForm(
    field: keyof AnimalForm,
    value: string
  ) {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // Validar formulário
  function validateForm(values: AnimalForm) {
    const dateIsValid =
      /^\d{4}-\d{2}-\d{2}$/.test(values.data) &&
      !Number.isNaN(
        new Date(`${values.data}T00:00:00`).getTime()
      );

    if (!dateIsValid) {
      Alert.alert('Atenção', 'Informe uma data válida (AAAA-MM-DD).');
      return false;
    }

    const [year, month, day] = values.data.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      Alert.alert('Atenção', 'A data informada não existe.');
      return false;
    }

    if (!values.quantidade.trim()) {
      Alert.alert('Atenção', 'Informe a quantidade.');
      return false;
    }

    const quantidade = Number(values.quantidade);

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade inteira maior que zero.');
      return false;
    }

    return true;
  }

  // Cadastrar animal
  async function createAnimal() {
    if (!validateForm(form)) return;

    try {
      setSaving(true);

      await animalsService.create({
        data: form.data,
        tipoAnimal: form.tipoAnimal,
        quantidade: Number(form.quantidade),
      });

      setForm(initialForm);

      Alert.alert('Sucesso', 'Registro cadastrado com sucesso!');

      await loadData();
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar o registro.'
      );
    } finally {
      setSaving(false);
    }
  }

  // Iniciar edição
  function startEditing(item: Animal) {
    setEditingId(item.id);

    setEditForm({
      data: getDateValue(item.data),
      tipoAnimal: item.tipoAnimal,
      quantidade: String(item.quantidade),
    });
  }

  // Atualizar registro
  async function updateAnimal() {
    if (editingId === null || !validateForm(editForm)) return;

    try {
      setSaving(true);

      await animalsService.update(editingId.toString(), {
        data: editForm.data,
        tipoAnimal: editForm.tipoAnimal,
        quantidade: Number(editForm.quantidade),
      });

      setEditingId(null);
      setEditForm(initialForm);

      Alert.alert('Sucesso', 'Registro atualizado com sucesso!');

      await loadData();
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o registro.'
      );
    } finally {
      setSaving(false);
    }
  }

  // Excluir registro
  function deleteAnimal(id: number) {
    Alert.alert(
      'Excluir registro',
      'Deseja realmente excluir este registro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await animalsService.remove(id.toString());

              Alert.alert('Sucesso', 'Registro excluído.');

              await loadData();
            } catch (error) {
              Alert.alert(
                'Erro',
                error instanceof Error
                  ? error.message
                  : 'Não foi possível excluir o registro.'
              );
            }
          },
        },
      ]
    );
  }

  // Filtros
  const filteredAnimals = useMemo(() => {
    return animals
      .filter((item) => {
        const month = getDateValue(item.data).slice(0, 7);

        const byDate = !filterDate || month === filterDate;

        const byType =
          filterType === 'todos' ||
          item.tipoAnimal === filterType;

        return byDate && byType;
      })
      .sort(
        (a, b) =>
          new Date(b.data).getTime() -
          new Date(a.data).getTime()
      );
  }, [animals, filterDate, filterType]);

  // Resumo
  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return animals.reduce(
      (total, item) => {
        const date = new Date(`${getDateValue(item.data)}T00:00:00`);

        if (Number.isNaN(date.getTime()) || date > today) {
          return total;
        }

        if (item.tipoAnimal === 'gato') {
          total.gatos += Number(item.quantidade);
        } else if (item.tipoAnimal === 'cachorro') {
          total.cachorros += Number(item.quantidade);
        }

        return total;
      },
      { gatos: 0, cachorros: 0 }
    );
  }, [animals]);

  // Campo reutilizável de formulário
  function renderForm(values: AnimalForm, editing = false) {
    const change = editing ? updateEditForm : updateForm;

    return (
      <View className="gap-4">
        <View>
          <Text className="mb-2 font-semibold text-gray-700">
            Data do registro
          </Text>

          <TextInput
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800"
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#9CA3AF"
            value={values.data}
            onChangeText={(value) => change('data', value)}
          />
        </View>

        <View>
          <Text className="mb-2 font-semibold text-gray-700">
            Tipo de animal
          </Text>

          <View className="flex-row gap-3">
            {(['gato', 'cachorro'] as AnimalType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => change('tipoAnimal', type)}
                className={`flex-1 items-center rounded-xl border p-3 ${
                  values.tipoAnimal === type
                    ? 'border-green-700 bg-green-700'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <Text
                  className={`font-semibold capitalize ${
                    values.tipoAnimal === type
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="mb-2 font-semibold text-gray-700">
            Quantidade
          </Text>

          <TextInput
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800"
            placeholder="Digite a quantidade"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={values.quantidade}
            onChangeText={(value) => change('quantidade', value)}
          />
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={editing ? updateAnimal : createAnimal}
            disabled={saving}
            className="flex-1 items-center rounded-xl bg-green-700 py-3"
          >
            <Text className="font-bold text-white">
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
            </Text>
          </Pressable>

          {editing && (
            <Pressable
              onPress={() => {
                setEditingId(null);
                setEditForm(initialForm);
              }}
              className="items-center rounded-xl bg-gray-200 px-5 py-3"
            >
              <Text className="font-semibold text-gray-700">
                Cancelar
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#15803D" />
        <Text className="mt-3 text-gray-600">
          Carregando registros...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-800">
          Registro de animais
        </Text>

        <Text className="mt-1 text-sm text-gray-500">
          Gerencie os registros de animais castrados.
        </Text>
      </View>

      {/* RESUMO */}
      <View className="mb-6">
        <Text className="mb-3 text-lg font-bold text-gray-800">
          Quantidades registradas
        </Text>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="text-sm text-gray-500">
              Gatos
            </Text>

            <Text className="mt-2 text-3xl font-bold text-green-700">
              {summary.gatos.toLocaleString('pt-BR')}
            </Text>

            <Text className="text-xs text-gray-400">
              castrados
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="text-sm text-gray-500">
              Cachorros
            </Text>

            <Text className="mt-2 text-3xl font-bold text-green-700">
              {summary.cachorros.toLocaleString('pt-BR')}
            </Text>

            <Text className="text-xs text-gray-400">
              castrados
            </Text>
          </View>
        </View>
      </View>

      {/* CADASTRO */}
      <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-4 text-lg font-bold text-gray-800">
          Novo registro
        </Text>

        {renderForm(form)}
      </View>

      {/* FILTROS */}
      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-3 text-lg font-bold text-gray-800">
          Filtrar registros
        </Text>

        <Text className="mb-2 font-semibold text-gray-700">
          Mês (AAAA-MM)
        </Text>

        <TextInput
          className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-gray-800"
          placeholder="Ex.: 2026-11"
          placeholderTextColor="#9CA3AF"
          value={filterDate}
          onChangeText={setFilterDate}
          maxLength={7}
        />

        <Text className="mb-2 font-semibold text-gray-700">
          Tipo de animal
        </Text>

        <View className="flex-row gap-2">
          {(['todos', 'gato', 'cachorro'] as const).map((type) => (
            <Pressable
              key={type}
              onPress={() => setFilterType(type)}
              className={`flex-1 items-center rounded-xl border p-2 ${
                filterType === type
                  ? 'border-green-700 bg-green-700'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <Text
                className={`text-xs font-semibold capitalize ${
                  filterType === type
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => {
            setFilterDate('');
            setFilterType('todos');
          }}
          className="mt-4 self-start"
        >
          <Text className="font-semibold text-green-700">
            Limpar filtros
          </Text>
        </Pressable>
      </View>

      {/* LISTAGEM */}
      <View>
        <Text className="mb-3 text-lg font-bold text-gray-800">
          Registros cadastrados ({filteredAnimals.length})
        </Text>

        {filteredAnimals.length === 0 ? (
          <View className="rounded-2xl bg-white p-6">
            <Text className="text-center text-gray-500">
              Nenhum registro encontrado.
            </Text>
          </View>
        ) : (
          filteredAnimals.map((item) => (
            <View
              key={item.id}
              className="mb-4 rounded-2xl bg-white p-5 shadow-sm"
            >
              {editingId === item.id ? (
                <>
                  <Text className="mb-4 text-lg font-bold text-gray-800">
                    Editar registro
                  </Text>

                  {renderForm(editForm, true)}
                </>
              ) : (
                <>
                  <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-lg font-bold capitalize text-gray-800">
                      {item.tipoAnimal}
                    </Text>

                    <View className="rounded-full bg-green-100 px-3 py-1">
                      <Text className="text-xs font-semibold text-green-800">
                        Registro #{item.id}
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2">
                    <Text className="text-gray-600">
                      Data: {formatLocalDate(item.data)}
                    </Text>

                    <Text className="text-gray-600">
                      Quantidade: {item.quantidade}
                    </Text>
                  </View>

                  <View className="mt-5 flex-row gap-3">
                    <Pressable
                      onPress={() => startEditing(item)}
                      className="flex-1 items-center rounded-xl bg-blue-50 py-3"
                    >
                      <Text className="font-semibold text-blue-700">
                        Editar
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => deleteAnimal(item.id)}
                      className="flex-1 items-center rounded-xl bg-red-50 py-3"
                    >
                      <Text className="font-semibold text-red-700">
                        Excluir
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))
        )}
      </View>

      <Pressable
        onPress={loadData}
        className="mt-2 items-center rounded-xl bg-gray-200 py-3"
      >
        <Text className="font-semibold text-gray-700">
          Atualizar registros
        </Text>
      </Pressable>
    </ScrollView>
  );
}
